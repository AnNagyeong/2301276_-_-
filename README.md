# 지금 서울 날씨 & 나의 옷차림 메모

서울의 현재 기온과 날씨를 확인하고, Google 계정으로 로그인해 오늘 입은 옷을 한 줄로 기록하는 기말 해커톤 리허설 프로젝트입니다. Open-Meteo는 별도 키 없이 호출하고, 메모는 Firebase Authentication과 Cloud Firestore를 사용합니다. HTML, CSS, JavaScript로 구성되어 빌드 없이 GitHub Pages에서 실행됩니다.

**배포 주소** · [지금 서울 날씨 & 나의 옷차림 메모](https://annagyeong.github.io/2301276_-_-/)

이 저장소는 GitHub Pages의 `main` 브랜치 루트에서 배포됩니다. Firebase 프로젝트 `seoul-weather-outfit`에 Google 로그인과 서울 리전 Firestore를 연결했습니다. 아래 설정 절차는 다른 Firebase 프로젝트나 GitHub 저장소에서 재현할 때 사용합니다.

## 로컬 실행

이 폴더에서 아래 명령을 실행하고 브라우저로 `http://localhost:8000`을 여세요. Windows에서 `python`이 인식되지 않으면 `py`를 사용하세요. Firebase 설정 전에도 인터넷에 연결되어 있으면 날씨를 조회할 수 있습니다.

```sh
python -m http.server 8000
```

## Firebase 연결

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트를 만들고 웹 앱을 등록합니다.
2. 프로젝트 설정에 표시되는 웹 앱의 설정 객체를 [firebase-config.js](firebase-config.js)에 붙여 넣고 `export const firebaseConfig` 선언을 유지합니다. 웹 SDK 설정 객체는 브라우저에 공개되며, 메모 접근 권한은 Firestore 규칙이 제어합니다. 서비스 계정 키는 저장소에 올리지 마세요.
3. **Authentication → Sign-in method**에서 **Google**을 사용 설정하고 지원 이메일을 선택합니다.
4. **Authentication → Settings → Authorized domains**에 로컬 테스트용 `localhost`와 배포용 `<깃허브-사용자명>.github.io`를 추가합니다. 사용자 지정 도메인을 사용한다면 그 호스트를 추가합니다. 프로토콜, 포트, 저장소 경로 없이 입력합니다.
5. **Firestore Database**에서 기본 데이터베이스를 프로덕션 모드로 만듭니다. 이 앱 전용 데이터베이스의 **Rules** 탭에 [firestore.rules](firestore.rules) 내용을 붙여 넣고 **Publish**를 누릅니다.

저장한 메모는 입력창 아래에 최근 수정 순으로 표시됩니다. 각 항목의 **수정**과 **삭제** 버튼으로 관리할 수 있습니다. 메모는 `users/{uid}/outfitMemos/{memoId}`에 저장되며, 기존 날짜별 메모도 같은 목록에 표시됩니다. Firestore 규칙은 본인 계정에만 메모 접근을 허용합니다.

## GitHub Pages 배포

1. GitHub에 새 저장소를 만들고 이 폴더 **안의 파일**을 `main` 브랜치 루트에 올립니다. 루트에 `index.html`과 `.nojekyll`이 있어야 합니다.
2. **Settings → Pages**에서 **Deploy from a branch**를 선택하고, 브랜치는 `main`, 폴더는 `/(root)`로 지정한 뒤 저장합니다.
3. 배포가 끝나면 **Settings → Pages**에서 실제 URL을 열고 README의 배포 주소를 갱신합니다.

## 배포 후 확인

- [ ] 서울 기온, 날씨 상태, 서울 시간 기준 시각이 표시되고 새로고침 버튼이 동작한다.
- [ ] Google 로그인 후 오늘의 메모를 저장할 수 있다.
- [ ] 같은 날에 여러 메모를 저장할 수 있고 새로고침해도 목록에 표시된다.
- [ ] 기존 메모를 수정하거나 삭제하면 목록에 반영된다.
- [ ] 로그아웃하면 메모가 숨겨지고, 다른 계정으로 로그인하면 그 계정의 메모만 표시된다.

로그인에 `auth/unauthorized-domain` 오류가 나면 Firebase에 배포 호스트가 등록됐는지 확인하세요. 메모 저장·조회가 실패하면 Firebase 프로젝트 설정과 Firestore 규칙이 같은 프로젝트에 적용됐는지 확인하세요. 배포 페이지가 404이면 Pages의 브랜치, 배포 폴더, `index.html` 위치를 확인하세요.

## 공식 문서

- [Open-Meteo API](https://open-meteo.com/en/docs)
- [Firebase Google 로그인](https://firebase.google.com/docs/auth/web/google-signin)
- [Firestore 보안 규칙](https://firebase.google.com/docs/firestore/security/get-started)
- [GitHub Pages 게시 소스 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
