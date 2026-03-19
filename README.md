# 📘 Solo Leveling JLPT API

JLPT 학습을 위한 Solo Leveling.JLPT(@sololeveling.jlpt) 기반 콘텐츠 API입니다.
문장, 단어, 문제 등을 제공하여 일본어 학습을 보다 재미있게 할 수 있도록 설계되었습니다.

---
>URL
https://sololevelingjlpt-production.up.railway.app/

---

## 🚀 Overview

이 프로젝트는 Solo Leveling 세계관을 활용하여 JLPT 학습 데이터를 제공합니다.

* 📖 문장 기반 학습
* 🧠 단어 & 문제 제공
* 🎯 JLPT 레벨별 콘텐츠 지원
* ⚡ API 기반 빠른 호출

---

## 🧩 Entrypoints

각 기능은 API 엔드포인트 형태로 제공됩니다.
`POST` 요청을 통해 JSON 입력값을 전달하면 결과를 받을 수 있습니다.

---

### 📌 1. Overview

현재 제공되는 학습 데이터 요약을 반환합니다.

* **Endpoint**

  ```
  POST /entrypoints/overview/invoke
  ```

* **Input**

  ```json
  {
    "input": {}
  }
  ```

* **설명**

  * 전체 데이터 개요
  * 지원 JLPT 레벨
  * 기본 학습 정보

---

### 📚 2. Vocabulary

JLPT 단어 학습 데이터를 제공합니다.

* **Endpoint**

  ```
  POST /entrypoints/vocabulary/invoke
  ```

* **Input**

  ```json
  {
    "input": {
      "level": "N5"
    }
  }
  ```

* **설명**

  * JLPT 레벨별 단어 제공
  * 의미, 읽기 포함

---

### 📝 3. Quiz

문제 풀이용 퀴즈 데이터를 반환합니다.

* **Endpoint**

  ```
  POST /entrypoints/quiz/invoke
  ```

* **Input**

  ```json
  {
    "input": {
      "level": "N4",
      "count": 5
    }
  }
  ```

* **설명**

  * 객관식 문제 제공
  * 정답 및 해설 포함

---

### 📖 4. Sentence

문장 기반 학습 콘텐츠를 제공합니다.

* **Endpoint**

  ```
  POST /entrypoints/sentence/invoke
  ```

* **Input**

  ```json
  {
    "input": {
      "level": "N3"
    }
  }
  ```

* **설명**

  * Solo Leveling 스타일 문장
  * 번역 및 해석 포함

---

### 🎯 5. Daily Challenge

하루 학습용 콘텐츠를 제공합니다.

* **Endpoint**

  ```
  POST /entrypoints/daily/invoke
  ```

* **Input**

  ```json
  {
    "input": {}
  }
  ```

* **설명**

  * 오늘의 단어
  * 오늘의 문제
  * 추천 학습 세트

---

## 💰 Pricing

| 기능         | 가격   |
| ---------- | ---- |
| Overview   | Free |
| Vocabulary | Free |
| Quiz       | Free |
| Sentence   | Free |
| Daily      | Free |

---

## 🛠️ Example (cURL)

```bash
curl -X POST \
  'https://sololevelingjlpt-production.up.railway.app/entrypoints/quiz/invoke' \
  -H 'Content-Type: application/json' \
  -d '{
    "input": {
      "level": "N5",
      "count": 3
    }
  }'
```

---

## 📦 Tech Stack

* Backend: Node.js / Express (추정)
* Hosting: Railway
* Data: JLPT Vocabulary + Custom Dataset

---

## 🎮 Use Cases

* 일본어 학습 앱
* JLPT 대비 서비스
* 게임형 학습 플랫폼
* Solo Leveling 팬 기반 학습 콘텐츠

---

## ⚠️ Notes

* 비공식 Solo Leveling 팬 프로젝트입니다.
* 상업적 사용 시 라이선스를 확인하세요.
* API 응답 구조는 추후 변경될 수 있습니다.

---

## 📬 Contact

문의 또는 개선 제안은 언제든 환영합니다. (cookong1010@naver.com, )

