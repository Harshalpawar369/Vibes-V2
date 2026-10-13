import React from "react";
import { useState, useEffect, useRef } from "react";
import axiosAiapi from "../../api/axiosAiapi.jsx";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

const Ai = () => {
  const [see, setSee] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const [chat, setChat] = useState([]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    const userMessage = message.trim();
    setChat((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: userMessage },
    ]);
    setMessage("");

    try {
      setLoading(true);
      const result = await axiosAiapi.post(
        "/askDelulu",
        {
          userMessage,
        },
        {
          withCredentials: true,
        },
      );
      const aiResponse = result.data.data.deluluResponse;
      setChat((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: aiResponse },
      ]);
     
    } catch (err) {
      console.log(err);
      setChat((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I couldn't respond. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  function handleChange(e) {
    setMessage(e.target.value);
  }

  return (
    <div className="w-full bg-white text-zinc-900 text-md font-[poppins]">
      {see ? (
        <div className="w-full md:w-1/3 fixed h-[80vh] bottom-20 right-5 border-4 border-black p-4  bg-white z-50 rounded-2xl flex flex-col overflow-hidden funky-shadow">
          <div className="text-black p-4 flex justify-between items-center rounded-2xl">
            <h2 className="font-bold uppercase tracking-tighter">
              Delulu AI Manager 💅
            </h2>
            <button onClick={() => setSee(false)}>✕</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3">
            {chat.length === 0 && (
              <div className="text-sm text-zinc-500">
                Ask for a vibe check to start the chat.
              </div>
            )}
            {chat.map((item) => (
              <div
                key={item.id}
                className={`w-full flex ${
                  item.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%]  px-3 py-2 rounded-md text-md font-bold leading-relaxed border-2 border-black ${
                    item.role === "user"
                      ? "bg-emerald-400"
                      : "bg-zinc-100"
                  }`}
                >
                  <ReactMarkdown>{item.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="w-full flex justify-start">
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed border-2 border-black bg-zinc-200">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <form
            className="p-4 border-t-2 border-zinc-100 flex-col flex-wrap"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                onChange={handleChange}
                value={message}
                placeholder="Ask for a vibe check..."
                className="flex-1 p-2 outline-none border-2 border-zinc-900 rounded-lg"
              />
              <motion.button
                type="submit"
                whileHover={{
                  x: 4,
                  y: 4,
                  boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
                }}
                whileTap={{
                  scale: 0.9,
                }}
                disabled={loading}
                className="bg-emerald-400 font-bold font-[poppins] border-3 px-1 py-0 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                {loading ? "Thinking..." : "Send"}
              </motion.button>
            </div>
          </form>
        </div>
      ) : (
        <div className="fixed bottom-5 right-5 z-50">
          <button
            onClick={() => setSee(true)}
            className="bg-emerald-400 font-bold border-4 p-4 border-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all rounded-full w-16 h-16 flex items-center justify-center text-xl font-[poppins]"
          >
            Ai
          </button>
        </div>
      )}
    </div>
  );
};

export default Ai;
