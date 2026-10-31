"use client";

import { useCallback, useEffect, useState } from "react";

export type AppLanguage = "mr" | "hi" | "en";

const dictionary: Record<string, Record<AppLanguage, string>> = {
  "गावठी कांदा": { mr: "गावठी कांदा", hi: "देसी प्याज़", en: "Desi Onion" },
  "लाल कांदा": { mr: "लाल कांदा", hi: "लाल प्याज़", en: "Red Onion" },
  "लोकवन गहू": { mr: "लोकवन गहू", hi: "लोकवन गेहूँ", en: "Lokwan Wheat" },
  "बन्सी गहू": { mr: "बन्सी गहू", hi: "बंसी गेहूँ", en: "Bansi Wheat" },
  "शरबती गहू": { mr: "शरबती गहू", hi: "शरबती गेहूँ", en: "Sharbati Wheat" },
  "GW 496 गहू": { mr: "GW 496 गहू", hi: "GW 496 गेहूँ", en: "GW 496 Wheat" },
  "श्रीराम-11 गहू": { mr: "श्रीराम-11 गहू", hi: "श्रीराम-11 गेहूँ", en: "Shriram-11 Wheat" },
  "मालदांडी ज्वारी": { mr: "मालदांडी ज्वारी", hi: "मालदांडी ज्वार", en: "Maldandi Jowar" },
  "पायनियर बाजरी*": { mr: "पायनियर बाजरी*", hi: "पायनियर बाजरा*", en: "Pioneer Bajra*" },
  "68 बाजरी*": { mr: "68 बाजरी*", hi: "68 बाजरा*", en: "68 Bajra*" },
  "मोहदया बाजरी*": { mr: "मोहदया बाजरी*", hi: "मोहदया बाजरा*", en: "Mohadaya Bajra*" },
  "हिरवा अख्खा मूग": { mr: "हिरवा अख्खा मूग", hi: "साबुत हरा मूंग", en: "Whole Green Moong" },
  "पांढरी तूर": { mr: "पांढरी तूर", hi: "सफेद अरहर", en: "White Pigeon Pea" },
  "तूर": { mr: "तूर", hi: "अरहर", en: "Tur" },

  "मराठी": { mr: "मराठी", hi: "मराठी", en: "Marathi" },
  "हिंदी": { mr: "हिंदी", hi: "हिंदी", en: "Hindi" },
  "English": { mr: "English", hi: "English", en: "English" },
  "शेतकऱ्यांकडून तुमच्या घरापर्यंत": { mr: "शेतकऱ्यांकडून तुमच्या घरापर्यंत", hi: "किसानों से सीधे आपके घर तक", en: "From farmers to your home" },
  "ऑर्डरनंतर फोनवर पुष्टी": { mr: "ऑर्डरनंतर फोनवर पुष्टी", hi: "ऑर्डर के बाद फोन पर पुष्टि", en: "Phone confirmation after order" },
  "बास्केट": { mr: "बास्केट", hi: "कार्ट", en: "Basket" },
  "ऑर्डर ट्रॅक करा": { mr: "ऑर्डर ट्रॅक करा", hi: "ऑर्डर ट्रैक करें", en: "Track order" },
  "मातीचा सुगंध • विश्वासाची चव": { mr: "मातीचा सुगंध • विश्वासाची चव", hi: "मिट्टी की खुशबू • भरोसे का स्वाद", en: "Rooted in the soil • Made with trust" },
  "गावाकडचे धान्य,": { mr: "गावाकडचे धान्य,", hi: "गाँव का अनाज,", en: "Grains from the village," },
  "आता तुमच्या घरी.": { mr: "आता तुमच्या घरी.", hi: "अब आपके घर तक।", en: "Delivered to your home." },
  "निवडक धान्य, पारंपरिक वाण आणि सोपी घरपोच ऑर्डर. तुमच्या कुटुंबासाठी योग्य धान्य निवडा.": { mr: "निवडक धान्य, पारंपरिक वाण आणि सोपी घरपोच ऑर्डर. तुमच्या कुटुंबासाठी योग्य धान्य निवडा.", hi: "चुना हुआ अनाज, पारंपरिक किस्में और आसान होम डिलीवरी। अपने परिवार के लिए अनाज चुनें।", en: "Quality grains, traditional varieties and easy home delivery. Choose the right grains for your family." },
  "धान्य निवडा": { mr: "धान्य निवडा", hi: "अनाज चुनें", en: "Shop grains" },
  "सोपी ऑर्डर": { mr: "सोपी ऑर्डर", hi: "आसान ऑर्डर", en: "Easy ordering" },
  "स्पष्ट किंमत": { mr: "स्पष्ट किंमत", hi: "स्पष्ट कीमत", en: "Clear pricing" },
  "फोनवर पुष्टी": { mr: "फोनवर पुष्टी", hi: "फोन पर पुष्टि", en: "Phone confirmation" },
  "थेट गावातून": { mr: "थेट गावातून", hi: "सीधे गाँव से", en: "Straight from the village" },
  "घरापर्यंत काळजीपूर्वक": { mr: "घरापर्यंत काळजीपूर्वक", hi: "सावधानी से आपके घर तक", en: "Carefully delivered to your home" },
  "निवडक धान्य": { mr: "निवडक धान्य", hi: "चुना हुआ अनाज", en: "Selected grains" },
  "विविध पारंपरिक वाण": { mr: "विविध पारंपरिक वाण", hi: "विभिन्न पारंपरिक किस्में", en: "Traditional varieties" },
  "तुमच्या गरजेनुसार": { mr: "तुमच्या गरजेनुसार", hi: "आपकी ज़रूरत के अनुसार", en: "Sized for your needs" },
  "घरपोच सेवा": { mr: "घरपोच सेवा", hi: "होम डिलीवरी", en: "Home delivery" },
  "पत्त्यानुसार पुष्टी": { mr: "पत्त्यानुसार पुष्टी", hi: "पते के अनुसार पुष्टि", en: "Delivery confirmed by address" },
  "आमची निवड": { mr: "आमची निवड", hi: "हमारा चयन", en: "Our selection" },
  "घरासाठी चांगले धान्य": { mr: "घरासाठी चांगले धान्य", hi: "आपके घर के लिए अच्छा अनाज", en: "Better grains for your home" },
  "वाण आणि बॅगचे वजन निवडा, मग बास्केटमध्ये जोडा.": { mr: "वाण आणि बॅगचे वजन निवडा, मग बास्केटमध्ये जोडा.", hi: "किस्म और पैक का वजन चुनें, फिर कार्ट में जोड़ें।", en: "Choose a variety and pack size, then add it to your basket." },
  "उत्पादने": { mr: "उत्पादने", hi: "उत्पाद", en: "products" },
  "किंमत निश्चित करायची": { mr: "किंमत निश्चित करायची", hi: "कीमत तय होना बाकी", en: "Price to be confirmed" },
  "वाण निवडा": { mr: "वाण निवडा", hi: "किस्म चुनें", en: "Choose variety" },
  "बॅगचे वजन": { mr: "बॅगचे वजन", hi: "पैक का वजन", en: "Pack size" },
  "किलो": { mr: "किलो", hi: "किलो", en: "kg" },
  "किंमत लवकरच": { mr: "किंमत लवकरच", hi: "कीमत जल्द तय होगी", en: "Price coming soon" },
  "किंमत बाकी": { mr: "किंमत बाकी", hi: "कीमत बाकी", en: "Price pending" },
  "तुमची खरेदी": { mr: "तुमची खरेदी", hi: "आपकी खरीदारी", en: "Your shopping" },
  "तुमची बास्केट": { mr: "तुमची बास्केट", hi: "आपका कार्ट", en: "Your basket" },
  "बॅगची संख्या + / − करून बदलू शकता.": { mr: "बॅगची संख्या + / − करून बदलू शकता.", hi: "पैक की संख्या + / − से बदल सकते हैं।", en: "Change the number of packs using + / −." },
  "तुमची बास्केट रिकामी आहे": { mr: "तुमची बास्केट रिकामी आहे", hi: "आपका कार्ट खाली है", en: "Your basket is empty" },
  "आवडते धान्य निवडून बास्केटमध्ये जोडा.": { mr: "आवडते धान्य निवडून बास्केटमध्ये जोडा.", hi: "अपना पसंदीदा अनाज चुनकर कार्ट में जोड़ें।", en: "Choose your favourite grains and add them to the basket." },
  "धान्य पाहा": { mr: "धान्य पाहा", hi: "अनाज देखें", en: "Browse grains" },
  "ऑर्डरचा तपशील": { mr: "ऑर्डरचा तपशील", hi: "ऑर्डर का विवरण", en: "Order summary" },
  "एकूण वजन": { mr: "एकूण वजन", hi: "कुल वजन", en: "Total weight" },
  "धान्याची किंमत": { mr: "धान्याची किंमत", hi: "अनाज की कीमत", en: "Grain subtotal" },
  "डिलिव्हरी": { mr: "डिलिव्हरी", hi: "डिलीवरी", en: "Delivery" },
  "एकूण रक्कम": { mr: "एकूण रक्कम", hi: "कुल राशि", en: "Total amount" },
  "ऑर्डर पुढे न्या": { mr: "ऑर्डर पुढे न्या", hi: "ऑर्डर आगे बढ़ाएँ", en: "Continue to checkout" },
  "फॉर्म बंद करा": { mr: "फॉर्म बंद करा", hi: "फ़ॉर्म बंद करें", en: "Close form" },
  "तुमचे नाव": { mr: "तुमचे नाव", hi: "आपका नाम", en: "Your name" },
  "पूर्ण नाव": { mr: "पूर्ण नाव", hi: "पूरा नाम", en: "Full name" },
  "मोबाईल नंबर": { mr: "मोबाईल नंबर", hi: "मोबाइल नंबर", en: "Mobile number" },
  "10 अंकी नंबर": { mr: "10 अंकी नंबर", hi: "10 अंकों का नंबर", en: "10-digit number" },
  "पूर्ण पत्ता": { mr: "पूर्ण पत्ता", hi: "पूरा पता", en: "Full address" },
  "घर क्रमांक, परिसर, शहर, पिनकोड": { mr: "घर क्रमांक, परिसर, शहर, पिनकोड", hi: "मकान नंबर, इलाका, शहर, पिनकोड", en: "House number, area, city, PIN code" },
  "ऑर्डर निश्चित करा": { mr: "ऑर्डर निश्चित करा", hi: "ऑर्डर कन्फ़र्म करें", en: "Place order" },
  "ऑर्डर नोंदवत आहे...": { mr: "ऑर्डर नोंदवत आहे...", hi: "ऑर्डर दर्ज हो रही है...", en: "Placing order..." },
  "होम": { mr: "होम", hi: "होम", en: "Home" },
  "धान्य": { mr: "धान्य", hi: "अनाज", en: "Grains" },
  "बास्केट पाहा": { mr: "बास्केट पाहा", hi: "कार्ट देखें", en: "View basket" },
  "गावाकडून घरापर्यंत विश्वासाने": { mr: "गावाकडून घरापर्यंत विश्वासाने", hi: "गाँव से घर तक भरोसे के साथ", en: "Trusted from village to home" },
  "ग्राहकांसाठी": { mr: "ग्राहकांसाठी", hi: "ग्राहकों के लिए", en: "For customers" },
  "धान्य आणि किंमती": { mr: "धान्य आणि किंमती", hi: "अनाज और कीमतें", en: "Grains & prices" },
  "ऑर्डर कशी करावी": { mr: "ऑर्डर कशी करावी", hi: "ऑर्डर कैसे करें", en: "How to order" },
  "मदत आणि संपर्क": { mr: "मदत आणि संपर्क", hi: "मदद और संपर्क", en: "Help & contact" },
  "ऑर्डर मदत": { mr: "ऑर्डर मदत", hi: "ऑर्डर सहायता", en: "Order help" },
  "ऑर्डर दिल्यानंतर आमची टीम फोनवर पुष्टी करेल.": { mr: "ऑर्डर दिल्यानंतर आमची टीम फोनवर पुष्टी करेल.", hi: "ऑर्डर देने के बाद हमारी टीम फोन पर पुष्टि करेगी।", en: "Our team will confirm your order by phone." },
  "डिलिव्हरी शुल्क आणि उपलब्धता पत्त्यानुसार कळवली जाईल.": { mr: "डिलिव्हरी शुल्क आणि उपलब्धता पत्त्यानुसार कळवली जाईल.", hi: "डिलीवरी शुल्क और उपलब्धता पते के अनुसार बताई जाएगी।", en: "Delivery charges and availability depend on your address." },
  "ऑर्डरविषयी प्रश्न? बास्केटकडे जा": { mr: "ऑर्डरविषयी प्रश्न? बास्केटकडे जा", hi: "ऑर्डर से जुड़ा सवाल? कार्ट देखें", en: "Questions about your order? View basket" },
  "आमच्याशी संपर्क करा": { mr: "आमच्याशी संपर्क करा", hi: "हमसे संपर्क करें", en: "Contact us" },
  "हेल्पलाइन": { mr: "हेल्पलाइन", hi: "हेल्पलाइन", en: "Helpline" },
  "आता कॉल करा": { mr: "आता कॉल करा", hi: "अभी कॉल करें", en: "Call now" },
  "ईमेल सपोर्ट": { mr: "ईमेल सपोर्ट", hi: "ईमेल सहायता", en: "Email support" },
  "ईमेल पाठवा": { mr: "ईमेल पाठवा", hi: "ईमेल भेजें", en: "Send email" },
  "ऑर्डर ट्रॅकिंग / ऑर्डरची मदत": { mr: "ऑर्डर ट्रॅकिंग / ऑर्डरची मदत", hi: "ऑर्डर ट्रैकिंग / ऑर्डर सहायता", en: "Order tracking / order help" },
  "ग्राहक सेवा वेळ": { mr: "ग्राहक सेवा वेळ", hi: "ग्राहक सेवा का समय", en: "Customer service hours" },
  "दररोज सकाळी ९ ते संध्याकाळी ७": { mr: "दररोज सकाळी ९ ते संध्याकाळी ७", hi: "रोज़ सुबह 9 से शाम 7 बजे", en: "Daily, 9 AM to 7 PM" },
  "सर्व हक्क राखीव.": { mr: "सर्व हक्क राखीव.", hi: "सर्वाधिकार सुरक्षित।", en: "All rights reserved." },
  "संपर्क": { mr: "संपर्क", hi: "संपर्क", en: "Contact" },
  "Gaav2Ghar विशेष बॅनर": { mr: "Gaav2Ghar विशेष बॅनर", hi: "Gaav2Ghar विशेष बैनर", en: "Gaav2Ghar featured banners" },
  "शेतकऱ्यांचा विश्वास": { mr: "शेतकऱ्यांचा विश्वास", hi: "किसानों का भरोसा", en: "Farmers' trust" },
  "गावाकडचे गहू, घरच्या पोळ्यांसाठी": { mr: "गावाकडचे गहू, घरच्या पोळ्यांसाठी", hi: "गाँव का गेहूँ, घर की रोटियों के लिए", en: "Village wheat for homemade meals" },
  "निवडक गहू आणि पारंपरिक वाण तुमच्या घरापर्यंत.": { mr: "निवडक गहू आणि पारंपरिक वाण तुमच्या घरापर्यंत.", hi: "चुना हुआ गेहूँ और पारंपरिक किस्में आपके घर तक।", en: "Selected wheat and traditional varieties delivered to your home." },
  "पारंपरिक पौष्टिकता": { mr: "पारंपरिक पौष्टिकता", hi: "पारंपरिक पौष्टिकता", en: "Traditional goodness" },
  "ज्वारी — रोजच्या जेवणाची चांगली निवड": { mr: "ज्वारी — रोजच्या जेवणाची चांगली निवड", hi: "ज्वार — रोज़ के भोजन का अच्छा विकल्प", en: "Jowar for everyday meals" },
  "तुमच्या गरजेनुसार पॅक निवडा आणि सहज ऑर्डर करा.": { mr: "तुमच्या गरजेनुसार पॅक निवडा आणि सहज ऑर्डर करा.", hi: "अपनी ज़रूरत के अनुसार पैक चुनें और आसानी से ऑर्डर करें।", en: "Choose the pack size you need and order with ease." },
  "गावचा अस्सल स्वाद": { mr: "गावचा अस्सल स्वाद", hi: "गाँव का असली स्वाद", en: "Authentic village taste" },
  "बाजरी आणि पारंपरिक धान्य": { mr: "बाजरी आणि पारंपरिक धान्य", hi: "बाजरा और पारंपरिक अनाज", en: "Bajra and traditional grains" },
  "गावाकडच्या चवीची आठवण प्रत्येक जेवणात.": { mr: "गावाकडच्या चवीची आठवण प्रत्येक जेवणात.", hi: "हर भोजन में गाँव के स्वाद की याद।", en: "A taste of the village in every meal." },
  "रोजच्या स्वयंपाकासाठी": { mr: "रोजच्या स्वयंपाकासाठी", hi: "रोज़ के खाने के लिए", en: "For everyday cooking" },
  "कांदेही मिळवा सोप्या पद्धतीने": { mr: "कांदेही मिळवा सोप्या पद्धतीने", hi: "प्याज़ भी आसानी से पाएँ", en: "Get onions with ease" },
  "घरच्या गरजेची निवड करा आणि ऑर्डरची माहिती सहज मिळवा.": { mr: "घरच्या गरजेची निवड करा आणि ऑर्डरची माहिती सहज मिळवा.", hi: "घर की ज़रूरत चुनें और ऑर्डर की जानकारी आसानी से पाएँ।", en: "Choose what your home needs and get order updates easily." },
  "सोपी घरपोच खरेदी": { mr: "सोपी घरपोच खरेदी", hi: "आसान होम डिलीवरी खरीदारी", en: "Easy home delivery shopping" },
  "तुमचे धान्य, तुमच्या पसंतीचा पॅक": { mr: "तुमचे धान्य, तुमच्या पसंतीचा पॅक", hi: "आपका अनाज, आपकी पसंद का पैक", en: "Your grains, your preferred pack" },
  "5, 25, 50 किंवा 100 किलोचे पॅक निवडा.": { mr: "5, 25, 50 किंवा 100 किलोचे पॅक निवडा.", hi: "5, 25, 50 या 100 किलो के पैक चुनें।", en: "Choose 5, 25, 50 or 100 kg packs." },
  "मागील बॅनर": { mr: "मागील बॅनर", hi: "पिछला बैनर", en: "Previous banner" },
  "पुढील बॅनर": { mr: "पुढील बॅनर", hi: "अगला बैनर", en: "Next banner" },
  "बॅनर निवडा": { mr: "बॅनर निवडा", hi: "बैनर चुनें", en: "Choose banner" },
  "बॅनर क्रमांक": { mr: "बॅनर क्रमांक", hi: "बैनर नंबर", en: "Banner number" },
  "शेतकरी आणि तुमच्या स्वयंपाकघरातील विश्वासाचा दुवा.": { mr: "शेतकरी आणि तुमच्या स्वयंपाकघरातील विश्वासाचा दुवा.", hi: "किसानों और आपकी रसोई के बीच भरोसे का रिश्ता।", en: "A trusted link between farmers and your kitchen." },
  "तुमची ऑर्डर कुठपर्यंत आली?": { mr: "तुमची ऑर्डर कुठपर्यंत आली?", hi: "आपकी ऑर्डर कहाँ तक पहुँची?", en: "Where is your order now?" },
  "ऑर्डरची पुष्टी झाल्यानंतर मिळालेला order ID आणि ऑर्डर देताना वापरलेला मोबाईल नंबर टाका.": { mr: "ऑर्डरची पुष्टी झाल्यानंतर मिळालेला order ID आणि ऑर्डर देताना वापरलेला मोबाईल नंबर टाका.", hi: "ऑर्डर आईडी और ऑर्डर देते समय इस्तेमाल किया गया मोबाइल नंबर दर्ज करें।", en: "Enter your order ID and the mobile number used when placing the order." },
  "नोंदणीकृत मोबाईल नंबर": { mr: "नोंदणीकृत मोबाईल नंबर", hi: "रजिस्टर्ड मोबाइल नंबर", en: "Registered mobile number" },
  "ऑर्डर तपासा": { mr: "ऑर्डर तपासा", hi: "ऑर्डर देखें", en: "Track order" },
  "तपासत आहे...": { mr: "तपासत आहे...", hi: "जाँच हो रही है...", en: "Checking..." },
  "सध्याची स्थिती:": { mr: "सध्याची स्थिती:", hi: "वर्तमान स्थिति:", en: "Current status:" },
  "ऑर्डर तारीख:": { mr: "ऑर्डर तारीख:", hi: "ऑर्डर की तारीख:", en: "Order date:" },
  "ऑर्डरमधील वस्तू": { mr: "ऑर्डरमधील वस्तू", hi: "ऑर्डर की वस्तुएँ", en: "Items in this order" },
  "ऑर्डरची पुष्टी बाकी": { mr: "ऑर्डरची पुष्टी बाकी", hi: "ऑर्डर की पुष्टि बाकी", en: "Awaiting confirmation" },
  "ऑर्डर निश्चित झाली": { mr: "ऑर्डर निश्चित झाली", hi: "ऑर्डर कन्फ़र्म हो गई", en: "Order confirmed" },
  "ऑर्डर पॅक केली": { mr: "ऑर्डर पॅक केली", hi: "ऑर्डर पैक हो गई", en: "Order packed" },
  "ऑर्डर डिलिव्हरीसाठी निघाली": { mr: "ऑर्डर डिलिव्हरीसाठी निघाली", hi: "ऑर्डर डिलीवरी के लिए निकल गई", en: "Out for delivery" },
  "ऑर्डर डिलिव्हर झाली": { mr: "ऑर्डर डिलिव्हर झाली", hi: "ऑर्डर डिलीवर हो गई", en: "Order delivered" },
  "ऑर्डर रद्द झाली": { mr: "ऑर्डर रद्द झाली", hi: "ऑर्डर रद्द हो गई", en: "Order cancelled" },
  "ही ऑर्डर रद्द करण्यात आली आहे. अधिक माहितीसाठी आमच्याशी संपर्क साधा.": { mr: "ही ऑर्डर रद्द करण्यात आली आहे. अधिक माहितीसाठी आमच्याशी संपर्क साधा.", hi: "यह ऑर्डर रद्द कर दी गई है। अधिक जानकारी के लिए संपर्क करें।", en: "This order was cancelled. Contact us for more information." },
  "सुरक्षित Admin": { mr: "सुरक्षित Admin", hi: "सुरक्षित एडमिन", en: "Secure Admin" },
  "ऑर्डर्स पाहण्यासाठी Admin password टाका.": { mr: "ऑर्डर्स पाहण्यासाठी Admin password टाका.", hi: "ऑर्डर देखने के लिए एडमिन पासवर्ड दर्ज करें।", en: "Enter the admin password to view orders." },
  "Admin Password": { mr: "Admin Password", hi: "एडमिन पासवर्ड", en: "Admin password" },
  "कृपया थांबा...": { mr: "कृपया थांबा...", hi: "कृपया प्रतीक्षा करें...", en: "Please wait..." },
  "Login करा": { mr: "Login करा", hi: "लॉगिन करें", en: "Log in" },
  "पासवर्ड विसरल्यास Vercel Environment Variables मध्ये ADMIN_PASSWORD तपासा.": { mr: "पासवर्ड विसरल्यास Vercel Environment Variables मध्ये ADMIN_PASSWORD तपासा.", hi: "पासवर्ड भूलने पर Vercel Environment Variables में ADMIN_PASSWORD देखें।", en: "If you forget the password, check ADMIN_PASSWORD in Vercel Environment Variables." },
  "ऑर्डर व्यवस्थापन": { mr: "ऑर्डर व्यवस्थापन", hi: "ऑर्डर प्रबंधन", en: "Order management" },
  "शेवटच्या 200 ऑर्डर्स": { mr: "शेवटच्या 200 ऑर्डर्स", hi: "पिछले 200 ऑर्डर", en: "Latest 200 orders" },
  "उत्पादने व किंमत": { mr: "उत्पादने व किंमत", hi: "उत्पाद और कीमत", en: "Products & pricing" },
  "सर्व ऑर्डर्स": { mr: "सर्व ऑर्डर्स", hi: "सभी ऑर्डर", en: "All orders" },
  "ऑर्डर्स लोड होत आहेत...": { mr: "ऑर्डर्स लोड होत आहेत...", hi: "ऑर्डर लोड हो रहे हैं...", en: "Loading orders..." },
  "या filter मध्ये ऑर्डर्स नाहीत.": { mr: "या filter मध्ये ऑर्डर्स नाहीत.", hi: "इस फ़िल्टर में कोई ऑर्डर नहीं है।", en: "No orders match this filter." },
  "ग्राहक:": { mr: "ग्राहक:", hi: "ग्राहक:", en: "Customer:" },
  "पत्ता:": { mr: "पत्ता:", hi: "पता:", en: "Address:" },
  "ऑर्डर वेळ:": { mr: "ऑर्डर वेळ:", hi: "ऑर्डर का समय:", en: "Order date:" },
  "उत्पादन व किंमत व्यवस्थापन": { mr: "उत्पादन व किंमत व्यवस्थापन", hi: "उत्पाद और कीमत प्रबंधन", en: "Product & pricing management" },
  "धान्याचे वाण, किलोचा दर आणि उपलब्धता बदला.": { mr: "धान्याचे वाण, किलोचा दर आणि उपलब्धता बदला.", hi: "अनाज की किस्म, प्रति किलो कीमत और उपलब्धता बदलें।", en: "Manage grain varieties, per-kg prices and availability." },
  "उत्पादन बदला": { mr: "उत्पादन बदला", hi: "उत्पाद बदलें", en: "Edit product" },
  "नवीन उत्पादन": { mr: "नवीन उत्पादन", hi: "नया उत्पाद", en: "New product" },
  "नाव (मराठी)": { mr: "नाव (मराठी)", hi: "नाम (मराठी)", en: "Name (Marathi)" },
  "दर (₹ प्रति किलो)": { mr: "दर (₹ प्रति किलो)", hi: "कीमत (₹ प्रति किलो)", en: "Price (₹ per kg)" },
  "वाण (comma ने वेगळे करा)": { mr: "वाण (comma ने वेगळे करा)", hi: "किस्में (कॉमा से अलग करें)", en: "Varieties (comma-separated)" },
  "वर्णन": { mr: "वर्णन", hi: "विवरण", en: "Description" },
  "ग्राहकांना उपलब्ध": { mr: "ग्राहकांना उपलब्ध", hi: "ग्राहकों के लिए उपलब्ध", en: "Available to customers" },
  "सेव्ह करा": { mr: "सेव्ह करा", hi: "सेव करें", en: "Save" },
  "रद्द करा": { mr: "रद्द करा", hi: "रद्द करें", en: "Cancel" },
  "सर्व उत्पादने": { mr: "सर्व उत्पादने", hi: "सभी उत्पाद", en: "All products" },
  "ग्राहकांना लपवलेले": { mr: "ग्राहकांना लपवलेले", hi: "ग्राहकों से छिपा हुआ", en: "Hidden from customers" },
  "किंमत निश्चित करणे बाकी": { mr: "किंमत निश्चित करणे बाकी", hi: "कीमत तय करना बाकी", en: "Price needs setting" },
  "उपलब्ध": { mr: "उपलब्ध", hi: "उपलब्ध", en: "Available" },

  "Order Management": { mr: "ऑर्डर व्यवस्थापन", hi: "ऑर्डर प्रबंधन", en: "Order management" },
  "Customer Orders": { mr: "ग्राहक ऑर्डर्स", hi: "ग्राहक ऑर्डर", en: "Customer orders" },
  "ऑर्डर्स": { mr: "ऑर्डर्स", hi: "ऑर्डर", en: "orders" },
  "पुष्टी बाकी": { mr: "पुष्टी बाकी", hi: "पुष्टि बाकी", en: "Pending confirmation" },
  "पुष्टी झाली": { mr: "पुष्टी झाली", hi: "पुष्टि हो गई", en: "Confirmed" },
  "पॅक केले": { mr: "पॅक केले", hi: "पैक किया गया", en: "Packed" },
  "डिलिव्हरीसाठी निघाले": { mr: "डिलिव्हरीसाठी निघाले", hi: "डिलीवरी के लिए निकल गया", en: "Out for delivery" },
  "डिलिव्हर झाले": { mr: "डिलिव्हर झाले", hi: "डिलीवर हो गया", en: "Delivered" },
  "रद्द केले": { mr: "रद्द केले", hi: "रद्द किया गया", en: "Cancelled" },
  "स्थिती उपलब्ध नाही": { mr: "स्थिती उपलब्ध नाही", hi: "स्थिति उपलब्ध नहीं", en: "Status unavailable" },

  "कांदा": { mr: "कांदा", hi: "प्याज़", en: "Onion" },
  "बाजरी": { mr: "बाजरी", hi: "बाजरा", en: "Bajra" },
  "मूग": { mr: "मूग", hi: "मूंग", en: "Moong" },
  "लोकवन": { mr: "लोकवन", hi: "लोकवन", en: "Lokwan" },
  "बन्सी": { mr: "बन्सी", hi: "बंसी", en: "Bansi" },
  "शरबती": { mr: "शरबती", hi: "शरबती", en: "Sharbati" },
  "पांढरी": { mr: "पांढरी", hi: "सफेद", en: "White" },
  "मालदांडी": { mr: "मालदांडी", hi: "मालदांडी", en: "Maldandi" },
  "दगडी": { mr: "दगडी", hi: "दगड़ी", en: "Dagdi" },
  "देशी": { mr: "देशी", hi: "देसी", en: "Native" },
  "हायब्रीड": { mr: "हायब्रीड", hi: "हाइब्रिड", en: "Hybrid" },
  "मोठ्या दाण्याची": { mr: "मोठ्या दाण्याची", hi: "बड़े दाने वाला", en: "Large grain" },
  "बारीक दाण्याची": { mr: "बारीक दाण्याची", hi: "छोटे दाने वाला", en: "Fine grain" },
  "बारीक दाणा": { mr: "बारीक दाणा", hi: "छोटा दाना", en: "Small grain" },
  "मोठा दाणा": { mr: "मोठा दाणा", hi: "बड़ा दाना", en: "Large grain" },
  "गहू": { mr: "गहू", hi: "गेहूँ", en: "Wheat" },
  "तांदूळ": { mr: "तांदूळ", hi: "चावल", en: "Rice" },
  "ज्वारी": { mr: "ज्वारी", hi: "ज्वार", en: "Jowar" },
  "तूर डाळ": { mr: "तूर डाळ", hi: "अरहर दाल", en: "Toor Dal" },
  "दैनंदिन पोळ्यांसाठी": { mr: "दैनंदिन पोळ्यांसाठी", hi: "रोज़ की रोटी के लिए", en: "For everyday flatbreads" },
  "घरच्या जेवणाची चव": { mr: "घरच्या जेवणाची चव", hi: "घर के खाने का स्वाद", en: "Taste of home-cooked meals" },
  "पारंपरिक आणि पौष्टिक": { mr: "पारंपरिक आणि पौष्टिक", hi: "पारंपरिक और पौष्टिक", en: "Traditional and nutritious" },
  "निवडक दर्जा": { mr: "निवडक दर्जा", hi: "चुनी हुई गुणवत्ता", en: "Selected quality" },
  "कमी करा": { mr: "कमी करा", hi: "कम करें", en: "Decrease" },
  "वाढवा": { mr: "वाढवा", hi: "बढ़ाएँ", en: "Increase" },


  "बास्केटमध्ये जोडले!": { mr: "बास्केटमध्ये जोडले!", hi: "कार्ट में जोड़ दिया गया!", en: "added to your basket!" },
  "ऑर्डर नोंदवता आली नाही.": { mr: "ऑर्डर नोंदवता आली नाही.", hi: "ऑर्डर दर्ज नहीं हो सकी।", en: "Could not place the order." },
  "कृपया नाव, योग्य 10 अंकी मोबाईल नंबर, पत्ता आणि बास्केट तपासा.": { mr: "कृपया नाव, योग्य 10 अंकी मोबाईल नंबर, पत्ता आणि बास्केट तपासा.", hi: "कृपया नाम, सही 10 अंकों का मोबाइल नंबर, पता और कार्ट जाँचें।", en: "Please check your name, valid 10-digit mobile number, address and basket." },
  "धन्यवाद! ऑर्डर नोंदवली. ऑर्डर क्रमांक: ": { mr: "धन्यवाद! ऑर्डर नोंदवली. ऑर्डर क्रमांक: ", hi: "धन्यवाद! ऑर्डर दर्ज हो गई। ऑर्डर नंबर: ", en: "Thank you! Your order is placed. Order number: " },
  ". फोनवरून पुष्टी केली जाईल.": { mr: ". फोनवरून पुष्टी केली जाईल.", hi: "। फोन पर पुष्टि की जाएगी।", en: ". We will confirm by phone." },
  "काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.": { mr: "काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.", hi: "कुछ गलत हुआ। कृपया फिर से प्रयास करें।", en: "Something went wrong. Please try again." },
  "₹1,500 किंवा अधिक खरेदीवर अंदाजित मोफत डिलिव्हरी. अंतिम शुल्क फोनवर कळवले जाईल.": { mr: "₹1,500 किंवा अधिक खरेदीवर अंदाजित मोफत डिलिव्हरी. अंतिम शुल्क फोनवर कळवले जाईल.", hi: "₹1,500 या उससे अधिक की खरीद पर अनुमानित मुफ़्त डिलीवरी। अंतिम शुल्क फोन पर बताया जाएगा।", en: "Estimated free delivery on orders of ₹1,500 or more. Final charges will be confirmed by phone." },
  "पेमेंट: घरपोच मिळाल्यावर (COD). ऑर्डरनंतर फोनवर पुष्टी केली जाईल.": { mr: "पेमेंट: घरपोच मिळाल्यावर (COD). ऑर्डरनंतर फोनवर पुष्टी केली जाईल.", hi: "भुगतान: डिलीवरी पर (COD)। ऑर्डर के बाद फोन पर पुष्टि की जाएगी।", en: "Payment: Cash on delivery (COD). Your order will be confirmed by phone." },
  "Admin Login": { mr: "Admin Login", hi: "एडमिन लॉगिन", en: "Admin Login" },
  "Order ID": { mr: "ऑर्डर ID", hi: "ऑर्डर ID", en: "Order ID" },
  "Order Tracking": { mr: "ऑर्डर ट्रॅकिंग", hi: "ऑर्डर ट्रैकिंग", en: "Order Tracking" },
  "उदा. G2G-...": { mr: "उदा. G2G-...", hi: "जैसे G2G-...", en: "e.g. G2G-..." },
  "पॅक": { mr: "पॅक", hi: "पैक", en: "packed" },

  "ऑर्डर": { mr: "ऑर्डर", hi: "ऑर्डर", en: "Order" },
};

export function translate(text: string, language: AppLanguage): string {
  return dictionary[text]?.[language] ?? text;
}

export function useAppLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>("mr");
  useEffect(() => {
    const stored = window.localStorage.getItem("gaav2ghar-language");
    if (stored === "mr" || stored === "hi" || stored === "en") setLanguageState(stored);
    const handle = (event: Event) => {
      const selected = (event as CustomEvent<AppLanguage>).detail;
      if (selected === "mr" || selected === "hi" || selected === "en") setLanguageState(selected);
    };
    window.addEventListener("gaav2ghar-language-change", handle);
    return () => window.removeEventListener("gaav2ghar-language-change", handle);
  }, []);
  const setLanguage = useCallback((next: AppLanguage) => {
    window.localStorage.setItem("gaav2ghar-language", next);
    setLanguageState(next);
    window.dispatchEvent(new CustomEvent("gaav2ghar-language-change", { detail: next }));
  }, []);
  const t = useCallback((text: string) => translate(text, language), [language]);
  return { language, setLanguage, t };
}

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useAppLanguage();
  return <label className="language-switcher" aria-label="Choose language">
    <span aria-hidden="true">🌐</span>
    <select value={language} onChange={(event) => setLanguage(event.target.value as AppLanguage)} aria-label="Choose language">
      <option value="mr" title="मराठी">मराठी</option>
      <option value="hi" title="हिंदी">हिंदी</option>
      <option value="en" title="English">EN</option>
    </select>
  </label>;
}
