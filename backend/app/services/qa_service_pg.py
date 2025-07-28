import logging
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain_core.prompts import ChatPromptTemplate

from . import vectorstore_service_pg
from ..core.config import settings

logger = logging.getLogger(__name__)

try:
    import nltk
    from nltk.tokenize import sent_tokenize
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt', quiet=True)
except ImportError:
    def sent_tokenize(text):
        import re
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import torch
import re

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

try:
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    embedding_model = None

def detect_language(text: str) -> str:
    text_lower = text.lower()

    spanish_words = ['qué', 'que', 'cómo', 'como', 'dónde', 'donde', 'cuándo', 'cuando', 'por qué', 'cuál', 'dame', 'dime', 'explica',
                    'documento', 'información', 'sobre', 'acerca', 'contenido', 'detalles']
    spanish_count = sum(1 for word in spanish_words if word in text_lower)
    
    english_words = ['what', 'how', 'where', 'when', 'why', 'which', 'tell', 'explain', 'give',
                    'document', 'information', 'about', 'content', 'details', 'the', 'this']
    english_count = sum(1 for word in english_words if word in text_lower)

    french_words = ['quoi', 'comment', 'où', 'quand', 'pourquoi', 'quel', 'donne', 'dis',
                   'document', 'information', 'sur', 'contenu', 'détails']
    french_count = sum(1 for word in french_words if word in text_lower)
    
    if spanish_count >= english_count and spanish_count >= french_count:
        return 'es'
    elif french_count >= english_count:
        return 'fr'
    else:
        return 'en'

def is_fallback_response(answer: str, detected_language: str) -> bool:
    if not answer:
        return True
        
    fallback_indicators = {
        'es': [
            "lo siento, no encontré",
            "no encontré información específica",
            "no encontré información relevante", 
            "los documentos disponibles no contienen",
            "necesito que seas más específico",
            "podrías reformular la pregunta",
            "no hay información disponible",
            "no pude encontrar",
            "reformular tu pregunta",
            "ser más específico",
            "documentos disponibles no tienen"
        ],
        'en': [
            "i'm sorry, i didn't find",
            "i didn't find specific information",
            "i didn't find relevant information",
            "the available documents don't contain",
            "i need you to be more specific",
            "could you rephrase the question",
            "no information available",
            "i couldn't find",
            "rephrase your question",
            "be more specific",
            "available documents don't have"
        ],
        'fr': [
            "je suis désolé, je n'ai pas trouvé",
            "je n'ai pas trouvé d'informations spécifiques",
            "je n'ai pas trouvé d'informations pertinentes",
            "les documents disponibles ne contiennent pas",
            "j'ai besoin que vous soyez plus spécifique",
            "pourriez-vous reformuler la question",
            "aucune information disponible",
            "je n'ai pas pu trouver",
            "reformuler votre question",
            "être plus spécifique"
        ]
    }
    
    answer_lower = answer.lower().strip()
    indicators = fallback_indicators.get(detected_language, fallback_indicators['en'])
    
    return any(indicator in answer_lower for indicator in indicators)

def evaluate_response_quality(answer: str, question: str, sources: list, detected_language: str) -> bool:
    if not answer or len(answer.strip()) < 80:
        return False
    
    if is_fallback_response(answer, detected_language):
        return False
    
    specific_indicators = [
        r'\d+', 
        r'\d+%', 
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', 
        r'\b(documento|sección|página|capítulo|artículo|tabla|figura|document|section|page|chapter|article|table|figure)\b',
        r'\b[A-Z][a-záéíóúñü]{2,}\b',
    ]
    
    has_specific_content = any(re.search(pattern, answer, re.IGNORECASE) for pattern in specific_indicators)
    
    mentions_documents = False
    if sources:
        doc_names = set(src.get("metadata", {}).get("source", "") for src in sources)
        doc_names = [name for name in doc_names if name and name != "unknown"]
        if doc_names:
            for doc_name in doc_names:
                doc_base = doc_name.lower().replace('.pdf', '').replace('.docx', '').replace('.txt', '')
                if doc_base in answer.lower() or doc_name.lower() in answer.lower():
                    mentions_documents = True
                    break
    
    has_good_length = len(answer.strip()) >= 100
    has_sources = len(sources) > 0
    
    quality_score = sum([
        has_specific_content,
        mentions_documents,
        has_good_length,
        has_sources
    ])
    
    return quality_score >= 2

def extract_document_names_from_question(question: str, available_docs: list) -> list:
    mentioned_docs = []
    question_lower = question.lower()
    
    for doc_name in available_docs:
        doc_name_lower = doc_name.lower()
        doc_base = doc_name_lower.replace('.pdf', '').replace('.docx', '').replace('.txt', '')
        
        if doc_name_lower in question_lower:
            mentioned_docs.append(doc_name)
        elif doc_base in question_lower:
            mentioned_docs.append(doc_name)
        elif len(doc_base) > 10:
            doc_words = doc_base.replace('_', ' ').replace('-', ' ').split()
            if len(doc_words) >= 2:
                matching_words = sum(1 for word in doc_words if len(word) > 3 and word in question_lower)
                if matching_words >= 2:
                    mentioned_docs.append(doc_name)
    
    unique_mentioned = []
    for doc in mentioned_docs:
        if doc not in unique_mentioned:
            unique_mentioned.append(doc)
    
    return unique_mentioned

def normalize_content_for_dedup(content: str) -> str:
    normalized = re.sub(r'\s+', ' ', content.strip())
    normalized = re.sub(r'^#+\s*', '', normalized)
    normalized = re.sub(r'^\[.*?\]\s*', '', normalized)
    return normalized.lower()

def extract_keywords_from_question(question: str) -> list:
    stop_words = {
        'es': ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'como', 'qué', 'cómo', 'cuál', 'dónde', 'sobre', 'acerca'],
        'en': ['the', 'of', 'and', 'a', 'to', 'in', 'is', 'you', 'that', 'it', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'what', 'how', 'which', 'where', 'about'],
        'fr': ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'quoi', 'comment', 'quel', 'où']
    }
    
    # Detectar idioma
    lang = detect_language(question)
    current_stop_words = stop_words.get(lang, stop_words['en'])
    words = re.findall(r'\b\w{3,}\b', question.lower())
    keywords = [word for word in words if word not in current_stop_words and len(word) > 2]
    
    return keywords

def calculate_keyword_relevance(content: str, keywords: list) -> float:
    if not keywords:
        return 0.0
    
    content_lower = content.lower()
    matches = sum(1 for keyword in keywords if keyword in content_lower)
    
    relevance_ratio = matches / len(keywords)
    
    if relevance_ratio >= 0.5:  
        return 0.3
    elif relevance_ratio >= 0.3:
        return 0.15
    elif relevance_ratio >= 0.1:
        return 0.05
    else:
        return -0.1 

def detect_generic_content_penalty(content: str) -> float:
    content_lower = content.lower()
    
    generic_patterns = [
        r'table of contents',
        r'índice de contenido',
        r'page \d+',
        r'página \d+',
        r'chapter \d+',
        r'capítulo \d+',
        r'^#+\s*$',  # Solo headers
        r'^\s*\|\s*\|\s*$',  # Tablas vacías
    ]
    
    penalty = 0.0
    for pattern in generic_patterns:
        if re.search(pattern, content_lower):
            penalty += 0.1
    
    if len(content.strip()) < 100:
        penalty += 0.15
    
    return min(penalty, 0.4) 
def deduplicate_and_rerank_sources(answer: str, sources: list[dict], question: str, max_sources: int = 5) -> list[dict]:
    if not sources:
        return []
    
    seen_content_normalized = set()
    seen_exact_content = set()
    unique_sources = []

    for i, src in enumerate(sources):
        content = src.get("content", "").strip()
        
        if not content or len(content) < 50:
            continue
        
        content_normalized = normalize_content_for_dedup(content)
        content_hash = hash(content)
        if content_hash in seen_exact_content:
            continue
            
        normalized_hash = hash(content_normalized)
        if normalized_hash in seen_content_normalized:
            continue
            
        is_substring = False
        for existing_src in unique_sources:
            existing_content = existing_src.get("content", "")
            if len(content) < len(existing_content) and content_normalized in normalize_content_for_dedup(existing_content):
                is_substring = True
                break
            elif len(existing_content) < len(content) and normalize_content_for_dedup(existing_content) in content_normalized:
                unique_sources = [s for s in unique_sources if s != existing_src]
                seen_content_normalized.discard(hash(normalize_content_for_dedup(existing_content)))
                seen_exact_content.discard(hash(existing_content))
                break
        
        if is_substring:
            continue
            
        seen_exact_content.add(content_hash)
        seen_content_normalized.add(normalized_hash)
        unique_sources.append(src)

    if not unique_sources:
        return []

    doc_groups = {}
    for src in unique_sources:
        doc_name = src.get("metadata", {}).get("source", "unknown")
        if doc_name not in doc_groups:
            doc_groups[doc_name] = []
        doc_groups[doc_name].append(src)

    question_keywords = extract_keywords_from_question(question)

    if embedding_model and len(unique_sources) > 1 and question.strip():
        try:
            texts = [s["content"] for s in unique_sources]
            
            embeddings = embedding_model.encode([question] + texts)
            question_emb = embeddings[0].reshape(1, -1)
            sources_emb = embeddings[1:]

            scores = cosine_similarity(question_emb, sources_emb).flatten()
            
            scored_sources = []
            for i, (src, base_score) in enumerate(zip(unique_sources, scores)):
                content = src["content"]
                metadata = src.get("metadata", {})
                keyword_bonus = calculate_keyword_relevance(content, question_keywords)
                
                length_bonus = min(len(content) / 1000, 0.2)
                section_bonus = 0.05 if metadata.get("section") else 0
                page_bonus = 0.02 if metadata.get("page_number") else 0
                
                quality_keywords = ['introduction', 'summary', 'conclusion', 'abstract', 'overview',
                                  'introducción', 'resumen', 'conclusión', 'abstracto', 'visión general']
                quality_bonus = 0.05 if any(keyword in content.lower() for keyword in quality_keywords) else 0
                generic_penalty = detect_generic_content_penalty(content)
                doc_name = metadata.get("source", "")
                doc_count = len(doc_groups.get(doc_name, []))
                diversity_penalty = min(0.03 * (doc_count - 1), 0.15)
                
                final_score = float(base_score) + keyword_bonus + length_bonus + section_bonus + page_bonus + quality_bonus - generic_penalty - diversity_penalty
                scored_sources.append((src, final_score, base_score))

            scored_sources.sort(key=lambda x: -x[1])
            min_threshold = 0.15
            high_quality_threshold = 0.25
            filtered_sources = [(src, final_score, base_score) for src, final_score, base_score in scored_sources
                              if final_score >= min_threshold]
            
            logger.info(f"Sources after threshold filtering: {len(filtered_sources)} (from {len(scored_sources)})")
            high_quality_sources = [(src, final_score, base_score) for src, final_score, base_score in filtered_sources 
                                  if final_score >= high_quality_threshold]
            
            if high_quality_sources:
                reranked_sources = [src for src, _, _ in high_quality_sources[:max_sources]]
                logger.info(f"Using {len(reranked_sources)} high-quality sources")
            elif filtered_sources:
                reranked_sources = [src for src, _, _ in filtered_sources[:min(3, max_sources)]]
                logger.info(f"Using {len(reranked_sources)} medium-quality sources")
            else:
                return []
                
        except Exception as e:
            return []
    else:
        return []

    final_sources = []
    docs_included = {}
    
    for src in reranked_sources:
        doc_name = src.get("metadata", {}).get("source", "unknown")
        current_count = docs_included.get(doc_name, 0)
        
        max_per_doc = max(2, max_sources // max(2, len(doc_groups)))
        
        if current_count < max_per_doc:
            final_sources.append(src)
            docs_included[doc_name] = current_count + 1
            
        if len(final_sources) >= max_sources:
            break

    cleaned_sources = []
    for i, src in enumerate(final_sources):
        content = src["content"]
        metadata = src.get("metadata", {})
        
        sentences = sent_tokenize(content)
        if len(sentences) >= 2:
            snippet = ". ".join(sentences[:2])
            if not snippet.endswith('.'):
                snippet += "."
        elif len(sentences) == 1:
            snippet = sentences[0]
            if len(snippet) > 300:
                snippet = snippet[:297] + "..."
        else:
            snippet = content[:250] + "..." if len(content) > 250 else content
        
        cleaned_source = {
            "snippet": snippet.strip(),
            "metadata": {
                **metadata,
                "snippet_length": len(snippet),
                "full_content_length": len(content),
                "source_rank": i + 1
            }
        }
        
        cleaned_sources.append(cleaned_source)

    return cleaned_sources

try:
    llm = ChatOpenAI(
        openai_api_key=settings.OPENAI_API_KEY,
        model_name="gpt-4o-mini-2024-07-18",
        temperature=0.1,
        max_tokens=1200,
        timeout=25,
        max_retries=2
    )
except Exception as e:
    llm = None

SPANISH_PROMPT = """
Eres un asistente experto que ayuda a los usuarios a entender sus documentos. Utiliza el contexto proporcionado para dar respuestas completas, precisas y útiles EN ESPAÑOL.

INSTRUCCIONES IMPORTANTES:
1. **SIEMPRE responde en español**, sin importar el idioma del contexto
2. **Proporciona respuestas completas y detalladas** (mínimo 4-5 oraciones)
3. **Menciona específicamente el nombre del documento** cuando extraigas información
4. **Cita información específica** como números, fechas, nombres y detalles técnicos
5. **Organiza tu respuesta** usando viñetas, numeración o párrafos cuando sea apropiado
6. **Si no encuentras la información**, di claramente que no está disponible

CONTEXTO DE LOS DOCUMENTOS:
{context}

PREGUNTA DEL USUARIO:
{question}

RESPUESTA EN ESPAÑOL:
Basándome en los documentos disponibles, puedo proporcionarte la siguiente información:

[Si no encuentras la respuesta en el contexto, responde: "Lo siento, no encontré información específica sobre tu consulta en los documentos disponibles. ¿Podrías reformular la pregunta o ser más específico sobre lo que buscas?"]
"""

ENGLISH_PROMPT = """
You are an expert assistant that helps users understand their documents. Use the provided context to give complete, precise, and useful answers IN ENGLISH.

IMPORTANT INSTRUCTIONS:
1. **ALWAYS respond in English**, regardless of the context language
2. **Provide complete and detailed responses** (minimum 4-5 sentences)
3. **Specifically mention the document name** when extracting information
4. **Cite specific information** such as numbers, dates, names, and technical details
5. **Organize your response** using bullet points, numbering, or paragraphs when appropriate
6. **If you don't find the information**, clearly state it's not available

DOCUMENT CONTEXT:
{context}

USER QUESTION:
{question}

RESPONSE IN ENGLISH:
Based on the available documents, I can provide you with the following information:

[If you don't find the answer in the context, respond: "I'm sorry, I didn't find specific information about your query in the available documents. Could you rephrase the question or be more specific about what you're looking for?"]
"""

FRENCH_PROMPT = """
Vous êtes un assistant expert qui aide les utilisateurs à comprendre leurs documents. Utilisez le contexte fourni pour donner des réponses complètes, précises et utiles EN FRANÇAIS.

INSTRUCTIONS IMPORTANTES:
1. **TOUJOURS répondre en français**, quel que soit la langue du contexte
2. **Fournir des réponses complètes et détaillées** (minimum 4-5 phrases)
3. **Mentionner spécifiquement le nom du document** lors de l'extraction d'informations
4. **Citer des informations spécifiques** telles que des chiffres, dates, noms et détails techniques
5. **Organiser votre réponse** en utilisant des puces, numérotation ou paragraphes si approprié
6. **Si vous ne trouvez pas l'information**, indiquer clairement qu'elle n'est pas disponible

CONTEXTE DES DOCUMENTS:
{context}

QUESTION DE L'UTILISATEUR:
{question}

RÉPONSE EN FRANÇAIS:
Basé sur les documents disponibles, je peux vous fournir les informations suivantes:

[Si vous ne trouvez pas la réponse dans le contexte, répondez: "Je suis désolé, je n'ai pas trouvé d'informations spécifiques sur votre requête dans les documents disponibles. Pourriez-vous reformuler la question ou être plus spécifique sur ce que vous cherchez?"]
"""

def get_prompt_template(language: str) -> ChatPromptTemplate:
    if language == 'es':
        return ChatPromptTemplate.from_template(SPANISH_PROMPT)
    elif language == 'fr':
        return ChatPromptTemplate.from_template(FRENCH_PROMPT)
    else:
        return ChatPromptTemplate.from_template(ENGLISH_PROMPT)

def get_available_documents(user_id: str) -> tuple[str, list]:
    try:
        retriever = vectorstore_service_pg.get_retriever(user_id, search_kwargs={"k": 20})
        if retriever:
            sample_docs = retriever.get_relevant_documents("document file content")
            sources = set()
            for doc in sample_docs:
                source = doc.metadata.get("source")
                if source:
                    sources.add(source)
            
            sources_list = sorted(list(sources))
            if sources_list:
                return f"Available documents: {', '.join(sources_list)}", sources_list
        return "No documents available", []
    except Exception as e:
        return "Error accessing documents", []

def get_no_relevant_docs_message(language: str) -> str:
    if language == 'es':
        return "Lo siento, no encontré información relevante sobre tu consulta en los documentos disponibles. ¿Podrías reformular la pregunta con términos más específicos?"
    elif language == 'fr':
        return "Je suis désolé, je n'ai pas trouvé d'informations pertinentes sur votre requête dans les documents disponibles. Pourriez-vous reformuler la question avec des termes plus spécifiques?"
    else:
        return "I'm sorry, I didn't find relevant information about your query in the available documents. Could you rephrase the question with more specific terms?"

def get_no_documents_message(language: str) -> str:
    if language == 'es':
        return "No pude acceder a tus documentos para responder la pregunta. Asegúrate de haber subido documentos primero."
    elif language == 'fr':
        return "Je n'ai pas pu accéder à vos documents pour répondre à la question. Assurez-vous d'avoir téléchargé des documents d'abord."
    else:
        return "I couldn't access your documents to answer the question. Make sure you have uploaded documents first."

def get_error_message(language: str) -> str:
    if language == 'es':
        return "Ocurrió un error al procesar tu consulta. Por favor, intenta nuevamente."
    elif language == 'fr':
        return "Une erreur s'est produite lors du traitement de votre requête. Veuillez réessayer."
    else:
        return "An error occurred while processing your query. Please try again."

def get_answer(question, user_id):
    if not llm:
        return "The response system is currently unavailable.", []
    detected_language = detect_language(question)
    available_docs_str, available_docs_list = get_available_documents(user_id)
    mentioned_docs = extract_document_names_from_question(question, available_docs_list)
    logger.info(f"Mentioned documents: {mentioned_docs}")
    search_kwargs = {
        "k": 10,  
        "filter": {"user_email": user_id}
    }
    
    retriever = vectorstore_service_pg.get_retriever(user_id, search_kwargs=search_kwargs)
    if not retriever:
        return get_no_documents_message(detected_language), []

    try:
        retrieved_docs = retriever.get_relevant_documents(question)
        filtered_docs = []
        question_keywords = extract_keywords_from_question(question)
        
        for doc in retrieved_docs:
            content = doc.page_content.strip()
            doc_source = doc.metadata.get("source", "")
            
            if len(content) < 50 or content.startswith("| 0"):
                continue
            
            if question_keywords:
                keyword_relevance = calculate_keyword_relevance(content, question_keywords)
                if keyword_relevance < -0.05:
                    continue
            
            if mentioned_docs:
                if doc_source in mentioned_docs:
                    filtered_docs.append(doc)
            else:
                filtered_docs.append(doc)
        
        if not filtered_docs:
            return get_no_relevant_docs_message(detected_language), []
        prompt_template = get_prompt_template(detected_language)
        
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={"prompt": prompt_template},
            return_source_documents=True
        )
        
    except Exception as e:
        logger.error(f"Error initializing QA chain: {e}", exc_info=True)
        return get_error_message(detected_language), []

    try:
        if filtered_docs:
            context_parts = [available_docs_str, "\n\nRELEVANT CONTENT:\n"]
            for i, doc in enumerate(filtered_docs[:5], 1):
                source = doc.metadata.get('source', 'Unknown')
                page = doc.metadata.get('page_number', 'N/A')
                section = doc.metadata.get('section', '')
                section_info = f", Section: {section}" if section else ""
                context_parts.append(f"\n[Document: {source}, Page: {page}{section_info}]\n{doc.page_content}\n")
            
            enhanced_context = "".join(context_parts)
            enhanced_question = f"Additional context: {enhanced_context}\n\nUser question: {question}"
        else:
            enhanced_question = question
        result = qa_chain.invoke({"query": enhanced_question})
        answer = result.get("result", "")
        logger.debug(f"LLM raw answer length: {len(answer)}")
        initial_answer_quality = len(answer.strip()) >= 80 and not is_fallback_response(answer, detected_language)
        sources = []

        if initial_answer_quality:
            raw_sources = []
            for doc in result.get("source_documents", []):
                content = doc.page_content.strip()
                doc_source = doc.metadata.get("source", "")
                
                if len(content) < 50:
                    continue
                
                if question_keywords:
                    keyword_relevance = calculate_keyword_relevance(content, question_keywords)
                    if keyword_relevance < -0.05:
                        continue
                    
                if mentioned_docs:
                    if doc_source in mentioned_docs:
                        raw_sources.append({
                            "content": content,
                            "metadata": doc.metadata
                        })
                else:
                    raw_sources.append({
                        "content": content,
                        "metadata": doc.metadata
                    })
            
            sources = deduplicate_and_rerank_sources(answer, raw_sources, question, max_sources=5)
            final_quality = evaluate_response_quality(answer, question, sources, detected_language)
            
            if not final_quality or not sources:
                sources = []

        if not answer or len(answer.strip()) < 80 or is_fallback_response(answer, detected_language) or not sources:
            return get_no_relevant_docs_message(detected_language), []

        
        return answer, sources

    except Exception as e:
        return get_error_message(detected_language), []