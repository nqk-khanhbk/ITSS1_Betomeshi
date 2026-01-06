import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFoodById } from "@/api/food.api";
import { generateDishScript } from "@/api/gemini.api";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from 'lucide-react';

const FoodScriptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [dishName, setDishName] = useState("");
  const [script, setScript] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const food = await getFoodById(id);
      setDishName(food.name);
      const aiData = await generateDishScript(food.name);
      console.log("AI Data received:", aiData);
      console.log("Messages:", aiData?.messages);
      console.log("Vocabulary:", aiData?.vocabulary);
      console.log("Grammar:", aiData?.grammar);
      setScript(aiData);
    } catch (err: any) {
      console.error(err);
      setScript(null);
      
      // Handle rate limit error specifically
      if (err.response?.status === 429) {
        setError("⚠️ APIリクエスト制限に達しました。1分後にもう一度お試しください。\n(Đã vượt quá giới hạn request API. Vui lòng thử lại sau 1 phút)");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(t("ScriptLoading.error") || 'Failed to load script');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading)
    return <div className="p-10 text-center">{t("ScriptLoading.title")}</div>;

  if (error)
    return (
      <div className="p-10 text-center max-w-2xl mx-auto">
        <p className="text-red-600 mb-4 whitespace-pre-line">{error}</p>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        >
          {t('common.retry') || 'もう一度試す (Retry)'}
        </button>
      </div>
    );

  return (
    <div className="min-h-screen max-w-5xl min-w-5xl py-12">

      <div className="max-w-4xl mx-auto relative">
        {/*Header*/}
        <div className="flex items-center gap-4 mb-6">
        {/* Back button (purple square) */}
            <button
              onClick={() => navigate(-1)}
              className="bg-purple-700 hover:bg-purple-800 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-md focus:outline-none"
              aria-label="Back"
            >
              <ChevronLeft size={20} className="text-white text-bold" />
            </button>

            <h1 className="flex-1 text-2xl sm:text-4xl font-extrabold text-center tracking-tight">
              <span className="text-gray-700 text-3xl mt-1">{dishName + " "}</span>
              <span className="text-gray-700 text-3xl mt-1">の会話レッスン</span>
            </h1>
        </div>

        {/* CHAT CONVERSATION */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg mb-6">
          {!script?.messages || script.messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>会話データがありません</p>
              <p className="text-sm mt-2">もう一度試してください</p>
            </div>
          ) : (
            <div className="space-y-4">
              {script.messages.map((msg: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'student' ? 'justify-start' : 'justify-start'} gap-3`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-2xl">
                    {msg.role === 'student' ? '🎓' : '👨‍🏫'}
                  </div>
                  
                  {/* Message bubble */}
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                      msg.role === 'student'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 opacity-70">
                      {msg.role === 'student' ? '留学生' : '日本人の先生'}
                    </div>
                    <p className="text-sm sm:text-base whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* VOCABULARY SECTION - Dropdown */}
        <details className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-lg mb-6">
          <summary className="text-xl font-bold text-blue-700 cursor-pointer hover:text-blue-800">
            📚 【TỪ VỰNG KHÓ】
          </summary>
          <div className="mt-4 space-y-3">
            {script?.vocabulary?.map((vocab: any, idx: number) => (
              <div key={idx} className="border-l-4 border-blue-400 pl-4 py-2">
                <div className="font-bold text-lg text-gray-800">{vocab.word}</div>
                <div className="text-sm text-gray-600">読み方: {vocab.reading}</div>
                <div className="text-sm text-gray-700 mt-1">意味: {vocab.meaning}</div>
              </div>
            ))}
          </div>
        </details>

        {/* GRAMMAR SECTION - Dropdown */}
        <details className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-lg">
          <summary className="text-xl font-bold text-green-700 cursor-pointer hover:text-green-800">
            ✏️ 【NGỮ PHÁP】
          </summary>
          <div className="mt-4 space-y-4">
            {script?.grammar?.map((gram: any, idx: number) => (
              <div key={idx} className="border-l-4 border-green-400 pl-4 py-2">
                <div className="font-bold text-lg text-gray-800">{gram.pattern}</div>
                <div className="text-sm text-gray-700 mt-1">{gram.explanation}</div>
                <div className="text-sm text-purple-700 mt-2 italic">
                  例: {gram.example}
                </div>
              </div>
            ))}
          </div>
        </details>

      </div>
    </div>
  );
};

export default FoodScriptPage;
