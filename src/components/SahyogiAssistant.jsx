import { useState, useRef, useEffect } from "react";
import { UserRound, X } from "lucide-react";
import { API_ROUTES } from "../apiRoutes";

let msgCounter = 1;
function getNextId(prefix) {
  msgCounter += 1;
  return `${prefix}-${msgCounter}`;
}

export default function SahyogiAssistant({ currentResult, lang = "hi" }) {
  const [isOpen, setIsOpen] = useState(false);

  const getGreeting = () => {
    switch (lang) {
      case "bn":
        return "নমস্কার! আমি সহযোগী (SAHYOGI)। আপনার ব্যবসার সম্ভাব্যতা, সরকারি ঋণ, লাভের হিসাব বা যেকোনো বিষয়ে আমাকে জিজ্ঞাসা করতে পারেন। বলুন কিভাবে সাহায্য করতে পারি?";
      case "mr":
        return "नमस्कार! मी सहयोगी (SAHYOGI) आहे. आपण मला या व्यवसायाची व्यवहार्यता, सरकारी कर्ज, नफ्याचे गणित किंवा कोणताही सामान्य प्रश्न विचारू शकता. सांगा मी कशी मदत करू?";
      case "te":
        return "నమస్కారం! నేను సహయోగి (SAHYOGI). మీరు ఈ వ్యాపార సాధ్యత, ప్రభుత్వ రుణాలు, లాభాల లెక్కలు లేదా ఏదైనా సాధారణ ప్రశ్న గురించి నన్ను అడగవచ్చు. నేను మీకు ఎలా సహాయం చేయగలను?";
      case "ta":
        return "வணக்கம்! நான் சஹயோகி (SAHYOGI). உங்கள் தொழில் சாத்தியக்கூறுகள், அரசு கடன்கள், லாப கணக்குகள் அல்லது ஏதேனும் பொதுவான கேள்விகளை நீங்கள் என்னிடம் கேட்கலாம். நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?";
      case "hinglish":
        return "Namaste! Main Sahyogi hoon. Aap mujhse is business, govt loan schemes, munafey ka hisab ya koi bhi sawal poochh sakte hain. Bataiye main kya madad karoon?";
      case "en":
        return "Hello! I am SAHYOGI, your business companion. You can ask me anything about your business feasibility, govt loans, profits, or any general question. How can I help you?";
      case "hi":
      default:
        return "नमस्ते! मैं सहयोगी (SAHYOGI) हूँ। आप मुझसे इस बिज़नेस के बारे में, सरकारी लोन, मुनाफ़े का गणित या कोई भी सामान्य सवाल पूछ सकते हैं। बताइए मैं क्या मदद करूँ?";
    }
  };

  const [messages, setMessages] = useState([
    {
      id: "welcome-1",
      sender: "sahyogi",
      text: getGreeting(),
      time: "Online",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const getQuickQuestions = () => {
    switch (lang) {
      case "bn":
        return [
          "দোকানে বিক্রি কীভাবে বাড়াব?",
          "মুদ্রা ঋণের নিয়ম কী?",
          "কম পুঁজিতে কোন ব্যবসা ভালো?",
          "সহযোগী, আপনি কে?",
        ];
      case "mr":
        return [
          "दुकानात विक्री कशी वाढवावी?",
          "मुद्रा कर्जाचे नियम काय आहेत?",
          "कमी भांडवलात कोणता व्यवसाय चांगला?",
          "सहयोगी, तू कोण आहेस?",
        ];
      case "te":
        return [
          "దుకాణంలో అమ్మకాలు ఎలా పెంచాలి?",
          "ముద్రా లోన్ నిబంధనలు ఏమిటి?",
          "తక్కువ పెట్టుబడితో ఏ వ్యాపారం మంచిది?",
          "సహయోగి, నువ్వు ఎవరు?",
        ];
      case "ta":
        return [
          "கடையில் விற்பனையை அதிகரிப்பது எப்படி?",
          "முத்ரா கடன் விதிகள் என்ன?",
          "குறைந்த முதலீட்டில் சிறந்த தொழில் எது?",
          "சஹயோகி, நீங்கள் யார்?",
        ];
      case "hinglish":
        return [
          "Dukaan me bikri kaise badhayein?",
          "Mudra loan ke niyam kya hain?",
          "Kam poonji me kaun sa kaam accha rahega?",
          "Sahyogi, tum kaun ho?",
        ];
      case "hi":
        return [
          "दुकान में बिक्री कैसे बढ़ाएं?",
          "मुद्रा लोन के नियम क्या हैं?",
          "कम पूँजी में कौन सा काम अच्छा रहेगा?",
          "सहयोगी, तुम कौन हो?",
        ];
      default:
        return [
          "How to increase shop sales?",
          "What are Mudra loan rules?",
          "Best business with low investment?",
          "Sahyogi, who are you?",
        ];
    }
  };

  const quickQuestions = getQuickQuestions();

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      id: getNextId("user"),
      sender: "user",
      text,
      time: "Sent",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setLoading(true);

    try {
      // Pass real business context only if user has analyzed a business
      const context = currentResult
        ? {
            business_name: currentResult.business || null,
            category: currentResult.category || null,
            district: currentResult.district || null,
            state: currentResult.state || null,
            project_cost: currentResult.scheme_analysis?.project_cost ?? null,
            promoter_margin: currentResult.scheme_analysis?.margin_capital ?? currentResult.scheme_analysis?.beneficiary_contribution ?? null,
            scheme_name: currentResult.scheme_analysis?.scheme_name ?? null,
            eligible_loan: currentResult.scheme_analysis?.eligible_loan ?? null,
            interest_rate: currentResult.scheme_analysis?.interest_rate ?? null,
            monthly_emi: currentResult.loan_affordability?.monthly_emi ?? null,
            loan_tenure_months: currentResult.loan_affordability?.loan_tenure_months ?? currentResult.scheme_analysis?.loan_tenure_months ?? null,
            moratorium_months: currentResult.loan_affordability?.moratorium_months ?? currentResult.scheme_analysis?.moratorium_months ?? null,
            monthly_profit: currentResult.financial_analysis?.monthly_profit ?? null,
            feasibility: currentResult.feasibilityVerdict || currentResult.feasibility || null,
          }
        : null;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(API_ROUTES.SAHYOGI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context,
          language: lang,
          lang,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const replyText =
        data.reply ||
        (lang === "bn"
          ? "দুঃখিত, উত্তর দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার জিজ্ঞাসা করুন।"
          : lang === "mr"
          ? "क्षमस्व, उत्तर देण्यात अडचण आली. कृपया पुन्हा विचारा."
          : lang === "te"
          ? "క్షమించండి, సమాధానం ఇవ్వడంలో సమస్య వచ్చింది. దయచేసి మళ్ళీ అడగండి."
          : lang === "ta"
          ? "மன்னிக்கவும், பதிலளிப்பதில் சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் கேட்கவும்."
          : lang === "hi"
          ? "माफ़ कीजिए, मुझे उत्तर देने में परेशानी हुई। कृपया दोबारा पूछें।"
          : "Sorry, I had trouble answering. Please ask again.");

      setMessages((prev) => [
        ...prev,
        {
          id: getNextId("sahyogi"),
          sender: "sahyogi",
          text: replyText,
          time: "Replied",
        },
      ]);
    } catch (err) {
      console.warn("Sahyogi assistant request failed:", err?.message || err);
      setMessages((prev) => [
        ...prev,
        {
          id: getNextId("sahyogi-err"),
          sender: "sahyogi",
          text:
            lang === "bn"
              ? "সার্ভারের সাথে সংযোগে সাময়িক সমস্যা হচ্ছে। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন।"
              : lang === "mr"
              ? "नेटवर्क किंवा सर्व्हरमध्ये अडचण येत आहे. कृपया थोड्या वेळाने पुन्हा विचारा."
              : lang === "te"
              ? "నెట్‌వర్క్ లేదా సర్వర్‌లో సమస్య ఉంది. దయచేసి కాసేపటి తర్వాత మళ్ళీ అడగండి."
              : lang === "ta"
              ? "சர்வரில் தற்காலிக சிக்கல் உள்ளது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்."
              : lang === "hi"
              ? "नेटवर्क या सर्वर में थोड़ी दिक्कत आ रही है। कृपया थोड़ी देर बाद दोबारा पूछें।"
              : "Assistant service is momentarily unreachable. Please try asking again shortly.",
          time: "Notice",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const bubbleText =
    lang === "bn"
      ? "সাহায্য প্রয়োজন? সহযোগীকে জিজ্ঞাসা করুন"
      : lang === "mr"
      ? "मदत हवी असल्यास, सहयोगीला विचारा"
      : lang === "te"
      ? "సహాయం కావాలా? సహయోగిని అడగండి"
      : lang === "ta"
      ? "உதவி தேவையா? சஹயோகியிடம் கேளுங்கள்"
      : lang === "hi"
      ? "कोई मदद चाहिए? सहयोगी से पूछें"
      : "Need any help, ask Sahyogi";

  const subtitleText =
    lang === "bn"
      ? "আপনার ব্যবসা সঙ্গী • যেকোনো প্রশ্ন করুন"
      : lang === "mr"
      ? "आपला व्यवसाय मित्र • काहीही विचारा"
      : lang === "te"
      ? "మీ వ్యాపార మిత్రుడు • ఏదైనా అడగండి"
      : lang === "ta"
      ? "உங்கள் வணிகத் தோழன் • எதையும் கேளுங்கள்"
      : lang === "hi"
      ? "आपका व्यापार साथी • कुछ भी पूछें"
      : "Business Sathi • Ask Anything";

  const placeholderText =
    lang === "bn"
      ? "সহযোগীকে প্রশ্ন করুন..."
      : lang === "mr"
      ? "सहयोगीला प्रश्न विचारा..."
      : lang === "te"
      ? "సహయోగిని ఏదైనా అడగండి..."
      : lang === "ta"
      ? "சஹயோகியிடம் கேள்வி கேளுங்கள்..."
      : lang === "hi"
      ? "सहयोगी से सवाल पूछें..."
      : "Ask SAHYOGI anything...";

  const sendBtnText =
    lang === "bn"
      ? "পাঠান"
      : lang === "mr"
      ? "पाठवा"
      : lang === "te"
      ? "పంపండి"
      : lang === "ta"
      ? "அனுப்பு"
      : lang === "hi"
      ? "भेजें"
      : "Send";

  return (
    <div className="sahyogi-container smrity-container" id="sahyogi-widget">
      {/* Small Help Bubble (Visible when popup is closed) */}
      {!isOpen && (
        <div
          className="sahyogi-help-bubble"
          onClick={() => setIsOpen(true)}
          role="button"
          tabIndex={0}
          aria-label={bubbleText}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
        >
          <span className="sahyogi-help-bubble-text">{bubbleText}</span>
          <span className="sahyogi-help-bubble-pointer" aria-hidden="true" />
        </div>
      )}

      {/* Chat Popup Box */}
      {isOpen && (
        <div className="sahyogi-popup smrity-popup" role="dialog" aria-label="SAHYOGI Assistant">
          {/* Header */}
          <div className="sahyogi-header smrity-header">
            <div className="sahyogi-header-left smrity-header-left">
              <div className="sahyogi-avatar smrity-avatar" aria-hidden="true">
                <UserRound size={18} />
              </div>
              <div>
                <h4 className="sahyogi-title smrity-title">
                  {lang === "bn" ? "সহযোগী (SAHYOGI)" : lang === "mr" ? "सहयोगी (SAHYOGI)" : lang === "hi" ? "सहयोगी (SAHYOGI)" : "SAHYOGI (সহযোগী)"}
                </h4>
                <p className="sahyogi-subtitle smrity-subtitle">
                  {subtitleText}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="sahyogi-close-btn smrity-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close SAHYOGI"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="sahyogi-messages smrity-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`smrity-msg-row ${m.sender === "user" ? "user-row" : "smrity-row"}`}
              >
                {m.sender !== "user" && (
                  <div className="smrity-mini-avatar" aria-hidden="true">
                    <UserRound size={13} />
                  </div>
                )}
                <div className={`smrity-bubble ${m.sender === "user" ? "user-bubble" : "smrity-bubble-ai"}`}>
                  <p className="smrity-text">{m.text}</p>
                  <span className="smrity-time">{m.time}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="smrity-msg-row smrity-row">
                <div className="smrity-mini-avatar" aria-hidden="true">
                  <UserRound size={13} />
                </div>
                <div className="smrity-bubble smrity-bubble-ai loading-bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question suggestions */}
          <div className="smrity-chips-scroll">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="smrity-chip"
                onClick={() => handleSend(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="smrity-footer">
            <input
              type="text"
              className="smrity-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              disabled={loading}
            />
            <button
              type="button"
              className="smrity-send-btn"
              onClick={() => handleSend()}
              disabled={!inputText.trim() || loading}
            >
              {sendBtnText}
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Button (Bottom Right Circle) */}
      <button
        type="button"
        id="sahyogi-trigger-btn"
        className={`smrity-trigger-button ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        title={isOpen ? (lang === "bn" ? "সহযোগী বন্ধ করুন" : lang === "mr" ? "सहयोगी बंद करा" : lang === "te" ? "సహయోగిని మూసివేయండి" : lang === "ta" ? "சஹயோகியை மூடவும்" : lang === "hi" ? "सहयोगी बंद करें" : "Close SAHYOGI") : (lang === "bn" ? "সহযোগীকে প্রশ্ন করুন" : lang === "mr" ? "सहयोगीला विचारा" : lang === "te" ? "సహయోగిని అడగండి" : lang === "ta" ? "சஹயோகியிடம் கேளுங்கள்" : lang === "hi" ? "सहयोगी से सवाल पूछें" : "Ask SAHYOGI")}
      >
        <span className="smrity-trigger-badge">
          {isOpen ? <X size={20} /> : <UserRound size={22} />}
        </span>
        <span className="smrity-trigger-subtext">SAHYOGI</span>
      </button>
    </div>
  );
}
