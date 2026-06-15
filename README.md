# 🎓 Campus Event Finder

Campus Event Finder एक फुल-स्टैक वेब एप्लीकेशन है जिसे कॉलेज कैंपस में होने वाले विभिन्न इवेंट्स (Technical, Cultural, Sports आदि) को खोजने, प्रबंधित करने और रजिस्टर करने की प्रक्रिया को आसान बनाने के लिए बनाया गया है। यह प्लेटफॉर्म स्टूडेंट्स, क्लब ऑर्गेनाइजर्स और एडमिन को एक ही जगह पर जोड़ता है।

इस प्रोजेक्ट में एक विशेष **AI Generative Content** फीचर जोड़ा गया है, जो यूजर की प्रोफाइल के आधार पर इवेंट के डिस्क्रिप्शन को पूरी तरह से पर्सनलाइज्ड और रोमांचक बना देता है!

---

## 🚀 मुख्य फीचर्स (Key Features)

### 👨‍🎓 स्टूडेंट्स के लिए (User Dashboard)
* **Live Event Feed & Search:** कैंपस के सभी एक्टिव इवेंट्स को एक साथ देखना और क्लब या इवेंट के नाम से तुरंत सर्च करना।
* **One-Click Internal Registration:** इवेंट के लिए सीधे प्लेटफॉर्म से रजिस्टर करना और बाहरी गूगल फॉर्म लिंक (यदि उपलब्ध हो) पर रीडायरेक्ट होना।
* **Gamified Ranking System:** स्टूडेंट ने कुल कितने इवेंट्स में रजिस्टर किया है, उसके आधार पर पूरे कॉलेज (Institution Rank) और सभी यूज़र्स में उसकी ओवरऑल रैंक (Overall Rank) लाइव देखना।
* **AI-Powered Personalized Descriptions ✨:** OpenAI GPT मॉडल का उपयोग करके, इवेंट का डिस्क्रिप्शन हर स्टूडेंट के लिए उसकी प्रोफाइल के अनुसार "एक्साइटिंग और पर्सनल" टोन में बदल जाता है।

### 🏢 ऑर्गेनाइजर्स के लिए (Organization Dashboard)
* **Secure Auth:** क्लब या ऑर्गेनाइजेशन के लिए सुरक्षित रजिस्ट्रेशन और लॉगिन।
* **Event Management:** नए इवेंट्स क्रिएट करना (नाम, क्लब, एलिजिबिलिटी, तारीख, डिस्क्रिप्शन और गूगल फॉर्म लिंक के साथ) और पुराने इवेंट्स को डिलीट करना।
* **Profile View:** ऑर्गेनाइजेशन और कॉलेज की जानकारी को मैनेज करना।

### 👑 एडमिन के लिए (Admin Dashboard)
* **Platform Stats:** कुल रजिस्टर्ड स्टूडेंट्स और ऑर्गेनाइजेशन्स की लाइव संख्या देखना।
* **Control:** सभी रजिस्टर्ड ऑर्गेनाइजेशन्स की लिस्ट और उनकी डिटेल्स को ट्रैक करना।

---

## 🛠️ टेक स्टैक (Tech Stack)

* **Frontend:** HTML5, CSS3 (Intersection Observer के साथ स्मूथ फेड-इन एनिमेशन), JavaScript (Vanilla JS)
* **Backend:** Python (Flask Web Framework)
* **Database:** SQLite (SQLAlchemy ORM के साथ), Many-to-Many Relationships
* **AI Integration:** OpenAI API (GPT-3.5-Turbo)
* **Deployment:** Backend - Render.com | Frontend - GitHub Pages

---

## 💻 लोकल कंप्यूटर पर सेटअप कैसे करें?

### बैकएंड सेटअप (Backend Setup)

1. **रिपोजिटरी क्लोन करें:**
```bash
   git clone [https://github.com/Himanshu9004/College-Event-Finder.git](https://github.com/Himanshu9004/College-Event-Finder.git)
   cd College-Event-Finder
