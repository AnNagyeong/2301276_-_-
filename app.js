import { firebaseConfig } from "./firebase-config.js";

const byId = (id) => document.getElementById(id);
const seoulDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", dateStyle: "short" });
const today = () => seoulDate.format(new Date());
const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
weatherUrl.search = new URLSearchParams({
  latitude: 37.5665,
  longitude: 126.9780,
  current: "temperature_2m,weather_code",
  timezone: "Asia/Seoul",
});

const weatherLabels = new Map([
  [0, "맑음"], [1, "대체로 맑음"], [2, "구름 조금"], [3, "흐림"],
  [45, "안개"], [48, "서리 안개"], [51, "약한 이슬비"], [53, "이슬비"], [55, "강한 이슬비"],
  [56, "약한 어는 이슬비"], [57, "강한 어는 이슬비"], [61, "약한 비"], [63, "비"],
  [65, "강한 비"], [66, "약한 어는 비"], [67, "강한 어는 비"], [71, "약한 눈"],
  [73, "눈"], [75, "강한 눈"], [77, "쌀알눈"], [80, "약한 소나기"], [81, "소나기"],
  [82, "강한 소나기"], [85, "약한 눈 소나기"], [86, "강한 눈 소나기"],
  [95, "뇌우"], [96, "약한 우박을 동반한 뇌우"], [99, "강한 우박을 동반한 뇌우"],
]);

async function loadWeather() {
  byId("refresh").disabled = true;
  byId("weather-data").hidden = true;
  byId("weather-status").textContent = "날씨를 불러오는 중입니다.";
  try {
    const response = await fetch(weatherUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Weather API HTTP " + response.status);
    const { current } = await response.json();
    if (!Number.isFinite(current?.temperature_2m) || !Number.isInteger(current.weather_code)
      || typeof current.time !== "string") throw new Error("Invalid weather data");
    byId("temperature").textContent = current.temperature_2m + " °C";
    byId("condition").textContent = weatherLabels.get(current.weather_code) ?? "상태 정보 없음";
    byId("weather-status").textContent = current.time.replace("T", " ") + " 기준 · 서울 시간";
    byId("weather-data").hidden = false;
  } catch (error) {
    console.error(error);
    byId("weather-status").textContent = "날씨를 불러오지 못했습니다. 새로고침을 눌러 다시 시도해 주세요.";
  } finally {
    byId("refresh").disabled = false;
  }
}

function authError(error) {
  switch (error.code) {
    case "auth/unauthorized-domain": return "Firebase 승인된 도메인에 현재 사이트의 호스트를 추가해 주세요.";
    case "auth/popup-blocked": return "브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.";
    case "auth/popup-closed-by-user": return "로그인 창이 닫혔습니다. 다시 시도할 수 있습니다.";
    case "auth/operation-not-allowed": return "Firebase에서 Google 로그인 제공업체를 활성화해 주세요.";
    default: return "로그인에 실패했습니다. 연결과 Firebase 설정을 확인해 주세요.";
  }
}

async function setupFirebase() {
  const status = byId("auth-status");
  if (!["apiKey", "authDomain", "projectId", "appId"].every((key) => firebaseConfig[key])) {
    status.textContent = "옷차림 메모를 사용하려면 README의 Firebase 설정을 완료해 주세요.";
    return;
  }

  const sdk = "https://www.gstatic.com/firebasejs/13.4.0/";
  const [{ initializeApp }, authSdk, store] = await Promise.all([
    import(sdk + "firebase-app.js"),
    import(sdk + "firebase-auth.js"),
    import(sdk + "firebase-firestore.js"),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = authSdk.getAuth(app);
  const db = store.getFirestore(app);
  const provider = new authSdk.GoogleAuthProvider();
  const login = byId("login");
  const logout = byId("logout");
  const form = byId("memo-form");
  const input = byId("memo");
  const save = byId("save");
  const retry = byId("load-memo");
  const memoStatus = byId("memo-status");
  let activeMemo;

  async function loadMemo(user, day) {
    const memo = { ref: store.doc(db, "users", user.uid, "outfitMemos", day), day };
    activeMemo = memo;
    byId("memo-date").textContent = day + " · 서울 시간";
    input.value = "";
    input.disabled = save.disabled = true;
    retry.hidden = true;
    memoStatus.textContent = "오늘의 메모를 불러오는 중입니다.";
    try {
      const snapshot = await store.getDocFromServer(memo.ref);
      if (activeMemo !== memo) return;
      input.value = snapshot.exists() ? snapshot.data().text : "";
      memoStatus.textContent = snapshot.exists() ? "오늘 저장한 메모입니다." : "오늘 저장한 메모가 없습니다.";
      input.disabled = save.disabled = false;
    } catch (error) {
      console.error(error);
      if (activeMemo !== memo) return;
      memoStatus.textContent = "메모를 불러오지 못했습니다. 연결 또는 Firestore 규칙을 확인해 주세요.";
      retry.hidden = false;
    }
  }

  authSdk.onAuthStateChanged(auth, (user) => {
    activeMemo = undefined;
    input.value = "";
    memoStatus.textContent = "";
    login.hidden = Boolean(user);
    logout.hidden = form.hidden = !user;
    status.textContent = user ? (user.displayName || "Google 계정") + " 님으로 로그인했습니다."
      : "Google 계정으로 로그인하면 오늘의 메모를 저장할 수 있습니다.";
    if (user) void loadMemo(user, today());
  }, (error) => {
    console.error(error);
    status.textContent = "로그인 상태를 확인하지 못했습니다.";
  });

  login.addEventListener("click", async () => {
    login.disabled = true;
    try {
      await authSdk.signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      status.textContent = authError(error);
    } finally {
      login.disabled = false;
    }
  });

  logout.addEventListener("click", async () => {
    logout.disabled = true;
    try {
      await authSdk.signOut(auth);
    } catch (error) {
      console.error(error);
      status.textContent = "로그아웃하지 못했습니다. 다시 시도해 주세요.";
    } finally {
      logout.disabled = false;
    }
  });

  retry.addEventListener("click", () => {
    if (auth.currentUser) void loadMemo(auth.currentUser, today());
  });

  document.addEventListener("visibilitychange", () => {
    const day = today();
    if (document.hidden || activeMemo?.day === day) return;
    byId("memo-date").textContent = day + " · 서울 시간";
    if (auth.currentUser) void loadMemo(auth.currentUser, day);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const memo = activeMemo;
    if (!memo || !auth.currentUser || save.disabled) return;
    const day = today();
    if (memo.day !== day) {
      await loadMemo(auth.currentUser, day);
      return;
    }
    const value = input.value.trim();
    if (!value || value.length > 120) {
      memoStatus.textContent = "공백을 제외한 메모를 1~120자로 입력해 주세요.";
      input.focus();
      return;
    }

    input.disabled = save.disabled = true;
    memoStatus.textContent = "저장하는 중입니다.";
    try {
      await store.setDoc(memo.ref, { text: value, updatedAt: store.serverTimestamp() });
      if (activeMemo !== memo) return;
      input.value = value;
      memoStatus.textContent = "오늘의 옷차림 메모를 저장했습니다.";
    } catch (error) {
      console.error(error);
      if (activeMemo === memo) memoStatus.textContent = "저장하지 못했습니다. 연결 또는 Firestore 규칙을 확인해 주세요.";
    } finally {
      if (activeMemo === memo) input.disabled = save.disabled = false;
    }
  });
}

byId("memo-date").textContent = today() + " · 서울 시간";
byId("refresh").addEventListener("click", loadWeather);
void loadWeather();
setupFirebase().catch((error) => {
  console.error(error);
  byId("auth-status").textContent = "Firebase를 시작하지 못했습니다. 네트워크와 웹 앱 설정을 확인해 주세요.";
});
