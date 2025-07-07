import { useEffect, useState } from "react";
import axios from "axios";

export const useUserDocuments = (token) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchDocuments = async () => {
      try {
        const response = await axios.get("/api/user-documents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocuments(response.data);
      } catch (error) {
        console.error("Failed to fetch user documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [token]);

  return { documents, loading };
};
