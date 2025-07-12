import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8001/api/v2';

const autoSelectBestSource = (sources, setSelectedSource) => {
  if (!sources?.length) return;
  
  const bestSource = sources[0];
  setSelectedSource({
    filename: bestSource.metadata?.source,
    page: bestSource.metadata?.page,
    snippet: bestSource.snippet || bestSource.content || "",
    autoSelected: true
  });
};

export const useChatLogic = (user, token, t, setSelectedSource) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);

  const sendQuestion = useCallback(async () => {
    if (!token || !user) return;

    try {
      const response = await axios.post(
        `${API_BASE}/chat/`,
        {
          question,
          user_id: user.email,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAnswer(response.data.answer);
      setSources(response.data.sources || []);

      if (response.data.sources?.length > 0) {
        setTimeout(() => autoSelectBestSource(response.data.sources, setSelectedSource), 100);
      }

      setQuestion("");
    } catch (err) {
      setAnswer(`${t('common.failed')} ${err.response?.data?.message || ""}`);
    }
  }, [question, token, user, t, setSelectedSource]);

  // Reset chat state when user changes
  useEffect(() => {
    setQuestion("");
    setAnswer("");
    setSources([]);
  }, [token, user]);

  return {
    question,
    answer,
    sources,
    setQuestion,
    sendQuestion
  };
};