import logging
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain_core.prompts import ChatPromptTemplate

from . import vectorstore_service  # Handles vectorstore loading/retrieval
from ..core.config import settings  # Loads env vars like OPENAI_API_KEY

logger = logging.getLogger(__name__)
#logging.basicConfig(level=settings.LOG_LEVEL)

import nltk
from nltk.tokenize import sent_tokenize

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# Initialize once globally
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def deduplicate_and_rerank_sources(answer: str, sources: list[dict]) -> list[dict]:
    seen = set()
    unique_sources = []

    # Deduplicate by content hash
    for src in sources:
        content = src.get("content", "").strip()
        if not content:
            continue
        h = hash(content)
        if h not in seen:
            seen.add(h)
            unique_sources.append(src)

    if not unique_sources:
        return []

    # Semantic reranking
    texts = [s["content"] for s in unique_sources]
    embeddings = embedding_model.encode([answer] + texts)
    answer_emb = embeddings[0].reshape(1, -1)
    sources_emb = embeddings[1:]

    scores = cosine_similarity(answer_emb, sources_emb).flatten()
    scored_sources = [
        (src, float(score)) for src, score in zip(unique_sources, scores)
        if score > 0.0  # Filter low-relevance
    ]
    # Sort descending by score
    reranked = sorted(scored_sources, key=lambda x: -x[1])

# Convert to cleaned format for frontend
    cleaned_sources = []
    for src, score in reranked:
        sentences = sent_tokenize(src["content"])
        best_sentence = sentences[0] if sentences else src["content"][:200]
        cleaned_sources.append({
            "snippet": best_sentence.strip(),
            "metadata": src["metadata"]
        })
    if not reranked:
        print("[⚠️] No relevant sources above threshold — returning fallback top sources.")
        reranked = [(src, 0.0) for src in unique_sources[:2]]


    return cleaned_sources[:4]

# Initialize LLM using environment-based API key and model name
try:
    llm = ChatOpenAI(
        openai_api_key=settings.OPENAI_API_KEY,
        model_name="gpt-4o-mini-2024-07-18",
        temperature=0.1  # More deterministic factual output
    )
    logger.info(f"Successfully initialized ChatOpenAI model: {llm.model_name}")
except Exception as e:
    logger.error(f"Failed to initialize ChatOpenAI: {e}", exc_info=True)
    llm = None

# Custom multilingual prompt template with fallback logic
PROMPT_TEMPLATE_STR = """
You are a helpful assistant. Use the context below to answer the question accurately.

If a section title like "Introduction", "Methods", or "Conclusion" is relevant, consider it carefully.

Context:
{context}

Question:
{question}

If the answer is not in the context, say in the language of the user that you \"couldn't find the answer in the documents.\"
if the language is spanish and the answer is not in the context, say this: \"Lo siento,no tengo respuesta para tu consulta. ¿Podrías darme un poco más de detalle o decirlo de otra forma ?\"
"""

prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE_STR)

def get_answer(question, user_id):
    if not llm:
        logger.error("LLM is not initialized. Returning fallback response.")
        return "LLM is not configured or available.", []

    logger.info(f"Received question from user '{user_id}': '{question}'")

    retriever = vectorstore_service.get_retriever(user_id, search_kwargs={"k": 15})
    if not retriever:
        logger.warning("No retriever found; vector store may be empty.")
        return "Could not access your documents to answer the question.", []

    try:
        # 🔍 Manually test retrieval BEFORE building the chain
        retrieved_docs = retriever.get_relevant_documents(question)
        for d in retrieved_docs:
            print(f"→ {d.metadata.get('source')} | {len(d.page_content)} chars | {d.page_content[:100]}")

        print(f"[DEBUG] Retrieved {len(retrieved_docs)} documents for: '{question}'")
        for d in retrieved_docs:
            print(f"→ {d.metadata.get('source')} | {d.page_content[:80]}")
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={"prompt": prompt_template},
            return_source_documents=True
        )
    except Exception as e:
        logger.error(f"Error initializing QA chain: {e}", exc_info=True)
        return "An error occurred while setting up the QA process.", []

    try:
        result = qa_chain.invoke({"query": question})
        answer = result.get("result")
        sources = []
        logger.debug(f"LLM raw answer: {answer}")


        raw_sources = [
        {
            "content": doc.page_content,
            "metadata": doc.metadata
        } for doc in result.get("source_documents", [])
            ]
        sources = deduplicate_and_rerank_sources(result["result"], raw_sources)
        if answer.strip().lower().startswith("je n'ai pas trouvé la réponse"):
            sources = []

        logger.info(f"Answer length: {len(answer) if answer else 0}. Sources: {len(sources)}")
        return answer, sources

    except Exception as e:
        logger.error(f"Error during QA invoke: {e}", exc_info=True)
        return "An error occurred while trying to find an answer.", []
