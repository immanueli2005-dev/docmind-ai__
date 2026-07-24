// mockData.js - Contains realistic mock data for DocMind AI frontend simulation

export const mockDocuments = [
  {
    id: "doc-1",
    name: "AI_Notes.pdf",
    type: "pdf",
    size: "1.4 MB",
    pages: 15,
    uploadDate: "2026-07-20",
    status: "Analyzed"
  },
  {
    id: "doc-2",
    name: "Machine_Learning.pdf",
    type: "pdf",
    size: "3.8 MB",
    pages: 32,
    uploadDate: "2026-07-21",
    status: "Analyzed"
  },
  {
    id: "doc-3",
    name: "Python_Guide.pdf",
    type: "pdf",
    size: "2.1 MB",
    pages: 45,
    uploadDate: "2026-07-23",
    status: "Analyzed"
  },
  {
    id: "doc-4",
    name: "Artificial_Intelligence.pdf",
    type: "pdf",
    size: "2.9 MB",
    pages: 28,
    uploadDate: "2026-07-22",
    status: "Analyzed"
  },
  {
    id: "doc-5",
    name: "Deep_Learning.pdf",
    type: "pdf",
    size: "5.6 MB",
    pages: 54,
    uploadDate: "2026-07-18",
    status: "Analyzed"
  },
  {
    id: "doc-6",
    name: "Research_Paper.pdf",
    type: "pdf",
    size: "1.1 MB",
    pages: 12,
    uploadDate: "2026-07-15",
    status: "Analyzed"
  }
];

export const mockActivities = [
  {
    id: "act-1",
    type: "upload",
    description: "Uploaded Python_Guide.pdf successfully",
    time: "2 hours ago"
  },
  {
    id: "act-2",
    type: "chat",
    description: "Asked: 'Explain neural networks.' in AI Chat",
    time: "3 hours ago"
  },
  {
    id: "act-3",
    type: "settings",
    description: "Updated workspace settings and notification channels",
    time: "1 day ago"
  },
  {
    id: "act-4",
    type: "upload",
    description: "Uploaded Machine_Learning.pdf successfully",
    time: "2 days ago"
  },
  {
    id: "act-5",
    type: "security",
    description: "Configured API access token for external workspace integrations",
    time: "2 days ago"
  }
];

export const suggestedQuestions = [
  "Explain neural networks.",
  "Summarize Chapter 5",
  "What are the advantages of AI?",
  "List all algorithms",
  "Explain supervised learning"
];

export const mockChatAnswers = {
  "explain neural networks": {
    content: "According to the uploaded documents, Artificial Neural Networks (ANNs) are computational models inspired by the structure and functioning of the human brain. They consist of interconnected nodes (neurons) that learn patterns from data and are widely used in classification, prediction, and deep learning applications.",
    citation: {
      document: "Machine_Learning.pdf",
      pages: "24",
      paragraph: "2",
      confidence: "98%",
      lastModified: "2026-07-21",
      referencedText: "Artificial Neural Networks (ANNs) are computational models inspired by the structure and functioning of the human brain. They consist of interconnected nodes (neurons) that learn patterns from data and are widely used in classification, prediction, and deep learning applications."
    }
  },
  "summarize chapter 5": {
    content: "Chapter 5 details the architectural deployment strategies, focusing on containerized microservices, horizontal scaling profiles, database replication configurations, and failover validation protocols.",
    citation: {
      document: "AI_Notes.pdf",
      pages: "12",
      paragraph: "3",
      confidence: "90%",
      lastModified: "2026-07-20",
      referencedText: "Container orchestration pipelines coordinate application deployments under Chapter 5. Load balancing limits trigger cluster node replications when usage indices peak."
    }
  },
  "what are the advantages of ai?": {
    content: "AI advantages include cost savings from automated task pipelines, optimized network cache routing, and increased operational accuracy.",
    citation: {
      document: "Artificial_Intelligence.pdf",
      pages: "8",
      paragraph: "5",
      confidence: "96%",
      lastModified: "2026-07-22",
      referencedText: "Operational cost reductions are achieved when neural pipelines automate indexing tasks. Cache efficiency averages 99.4% in testing setups."
    }
  },
  "list all algorithms": {
    content: "Key algorithms detailed in the files include backpropagation gradients, regression model calculations, and K-Means clustering optimizations.",
    citation: {
      document: "Machine_Learning.pdf",
      pages: "15",
      paragraph: "1",
      confidence: "94%",
      lastModified: "2026-07-21",
      referencedText: "Algorithm models include regression boundaries, backpropagation loss feedback, and unsupervised cluster centroids."
    }
  },
  "explain supervised learning": {
    content: "Supervised learning builds a function mapping inputs to target labels using pre-classified training datasets and margin optimizations.",
    citation: {
      document: "Machine_Learning.pdf",
      pages: "3",
      paragraph: "4",
      confidence: "95%",
      lastModified: "2026-07-21",
      referencedText: "Under supervised learning, model parameters align margins to match target classification tags, penalizing errors dynamically."
    }
  }
};

export const defaultMockAnswer = {
  content: "I've analyzed your document context. The query correlates with sections relating to baseline operational parameters, system integration steps, and target timelines. Let me know if you would like me to narrow down this context.",
  citation: {
    document: "AI_Notes.pdf",
    pages: "5",
    paragraph: "1",
    confidence: "82%",
    lastModified: "2026-07-20",
    referencedText: "Workspace models index document parameters using semantic vectors. Context boundaries isolate query targets."
  }
};

export const errorMockAnswer = {
  content: "I couldn't find this information in the uploaded documents.",
  citation: {
    document: "None",
    pages: "N/A",
    paragraph: "N/A",
    confidence: "0%",
    lastModified: "N/A",
    referencedText: ""
  }
};

// Prepopulated multi-thread conversation history lists
export const mockConversations = [
  {
    id: "chat-1",
    title: "Neural Networks Overview",
    documentId: "doc-2",
    documentName: "Machine_Learning.pdf",
    dateGroup: "Today",
    date: "2026-07-23",
    messages: [
      {
        id: "msg-1-1",
        sender: "user",
        content: "Explain neural networks.",
        timestamp: "09:30 PM"
      },
      {
        id: "msg-1-2",
        sender: "assistant",
        content: "According to the uploaded documents, Artificial Neural Networks (ANNs) are computational models inspired by the structure and functioning of the human brain. They consist of interconnected nodes (neurons) that learn patterns from data and are widely used in classification, prediction, and deep learning applications.",
        timestamp: "09:31 PM",
        citation: {
          document: "Machine_Learning.pdf",
          pages: "24",
          paragraph: "2",
          confidence: "98%",
          lastModified: "2026-07-21",
          referencedText: "Artificial Neural Networks (ANNs) are computational models inspired by the structure and functioning of the human brain. They consist of interconnected nodes (neurons) that learn patterns from data and are widely used in classification, prediction, and deep learning applications."
        }
      }
    ]
  },
  {
    id: "chat-2",
    title: "Python Setup Guide",
    documentId: "doc-3",
    documentName: "Python_Guide.pdf",
    dateGroup: "Yesterday",
    date: "2026-07-22",
    messages: [
      {
        id: "msg-2-1",
        sender: "user",
        content: "How do I install virtual env?",
        timestamp: "03:15 PM"
      },
      {
        id: "msg-2-2",
        sender: "assistant",
        content: "Use command `python -m venv venv` to start an isolated environment path in Python. Activate it via standard shell commands.",
        timestamp: "03:16 PM",
        citation: {
          document: "Python_Guide.pdf",
          pages: "3",
          paragraph: "1",
          confidence: "95%",
          lastModified: "2026-07-23",
          referencedText: "Setup environment folders using standard virtual environments package commands: python -m venv."
        }
      }
    ]
  }
];

// Upgraded Semantic Search RAG Database
export const mockRAGData = {
  "explain neural networks": {
    answer: "According to the uploaded documents, Artificial Neural Networks (ANNs) are computational models inspired by the structure and functioning of the human brain. They consist of interconnected nodes (neurons) that learn patterns from data and are widely used in classification, prediction, and deep learning applications.",
    citation: {
      document: "Machine_Learning.pdf",
      pages: "24",
      paragraph: "2",
      confidence: "98%",
      lastModified: "2026-07-21",
      referencedText: "Artificial Neural Networks (ANNs) are computational models inspired by the structure and functioning of the human brain. They consist of interconnected nodes (neurons) that learn patterns from data and are widely used in classification, prediction, and deep learning applications."
    },
    chunks: [
      {
        id: "chunk-1",
        document: "Machine_Learning.pdf",
        page: 24,
        paragraph: 2,
        similarity: 98,
        readingTime: "1.1 min",
        content: "According to the uploaded documents, <mark>Artificial Neural Networks (ANNs)</mark> are computational models inspired by the structure and functioning of the human brain. They consist of <mark>interconnected nodes (neurons)</mark> that learn patterns from data and are widely used in classification, prediction, and deep learning applications.",
        concepts: ["Artificial Neural Network", "Neurons", "Deep Learning"]
      },
      {
        id: "chunk-2",
        document: "Machine_Learning.pdf",
        page: 18,
        paragraph: 4,
        similarity: 96,
        readingTime: "1.4 min",
        content: "An ANN training model configures learning weights using gradients. Nodes process inputs via activation functions mapping vector targets.",
        concepts: ["Training Model", "Gradients", "Nodes"]
      }
    ],
    comparison: {
      term: "neural networks",
      keywordResult: "No exact match found in Traditional Keyword index (exact phrase is missing).",
      semanticMatches: [
        { term: "Artificial Neural Network", weight: "98%" },
        { term: "Deep Learning", weight: "96%" },
        { term: "Neurons", weight: "93%" }
      ]
    },
    performance: {
      searchTime: 0.42,
      docsSearched: 5,
      chunksRetrieved: 8,
      pagesAnalyzed: 142,
      similarityScore: 98,
      speed: "Fast"
    }
  },
  "summarize chapter 5": {
    answer: "Chapter 5 details the architectural deployment strategies, focusing on containerized microservices, horizontal scaling profiles, database replication configurations, and failover validation protocols.",
    citation: {
      document: "AI_Notes.pdf",
      pages: "12",
      paragraph: "3",
      confidence: "90%",
      lastModified: "2026-07-20",
      referencedText: "Container orchestration pipelines coordinate application deployments under Chapter 5. Load balancing limits trigger cluster node replications when usage indices peak."
    },
    chunks: [
      {
        id: "chunk-3",
        document: "AI_Notes.pdf",
        page: 12,
        paragraph: 3,
        similarity: 95,
        readingTime: "1 min",
        content: "Container orchestration pipelines coordinate application deployments under <mark>Chapter 5</mark>. Load balancing limits trigger cluster node replications when usage indices peak.",
        concepts: ["Chapter 5", "Orchestration", "Load Balancing"]
      }
    ],
    comparison: {
      term: "Chapter 5 Summary",
      keywordResult: "No exact match found for literal string 'Chapter 5 Summary'.",
      semanticMatches: [
        { term: "orchestration systems", weight: "95%" },
        { term: "load balancing", weight: "91%" }
      ]
    },
    performance: {
      searchTime: 0.38,
      docsSearched: 4,
      chunksRetrieved: 5,
      pagesAnalyzed: 110,
      similarityScore: 95,
      speed: "Fast"
    }
  },
  "what are the advantages of ai?": {
    answer: "AI advantages include cost savings from automated task pipelines, optimized network cache routing, and increased operational accuracy.",
    citation: {
      document: "Artificial_Intelligence.pdf",
      pages: "8",
      paragraph: "5",
      confidence: "96%",
      lastModified: "2026-07-22",
      referencedText: "Operational cost reductions are achieved when neural pipelines automate indexing tasks. Cache efficiency averages 99.4% in testing setups."
    },
    chunks: [
      {
        id: "chunk-4",
        document: "Artificial_Intelligence.pdf",
        page: 8,
        paragraph: 5,
        similarity: 96,
        readingTime: "1.2 min",
        content: "Operational <mark>cost reductions</mark> are achieved when neural pipelines automate indexing tasks. Cache efficiency averages 99.4% in testing setups.",
        concepts: ["Cost Reductions", "Neural Pipelines", "Automated Tasks"]
      }
    ],
    comparison: {
      term: "advantages of AI",
      keywordResult: "No exact match found for 'advantages of AI' in traditional search indexes.",
      semanticMatches: [
        { term: "cost reductions", weight: "96%" },
        { term: "automation", weight: "94%" }
      ]
    },
    performance: {
      searchTime: 0.45,
      docsSearched: 5,
      chunksRetrieved: 6,
      pagesAnalyzed: 125,
      similarityScore: 96,
      speed: "Fast"
    }
  },
  "list all algorithms": {
    answer: "Key algorithms detailed in the files include backpropagation gradients, regression model calculations, and K-Means clustering optimizations.",
    citation: {
      document: "Machine_Learning.pdf",
      pages: "15",
      paragraph: "1",
      confidence: "94%",
      lastModified: "2026-07-21",
      referencedText: "Algorithm models include regression boundaries, backpropagation loss feedback, and unsupervised cluster centroids."
    },
    chunks: [
      {
        id: "chunk-5",
        document: "Machine_Learning.pdf",
        page: 15,
        paragraph: 1,
        similarity: 94,
        readingTime: "2 min",
        content: "Algorithm models include <mark>regression boundaries</mark>, <mark>backpropagation loss feedback</mark>, and unsupervised cluster centroids.",
        concepts: ["Regression", "Backpropagation", "Centroids"]
      }
    ],
    comparison: {
      term: "algorithms list",
      keywordResult: "No exact match found for 'list all algorithms'.",
      semanticMatches: [
        { term: "regression", weight: "94%" },
        { term: "backpropagation", weight: "92%" }
      ]
    },
    performance: {
      searchTime: 0.41,
      docsSearched: 6,
      chunksRetrieved: 4,
      pagesAnalyzed: 186,
      similarityScore: 94,
      speed: "Fast"
    }
  },
  "explain supervised learning": {
    answer: "Supervised learning builds a function mapping inputs to target labels using pre-classified training datasets and margin optimizations.",
    citation: {
      document: "Machine_Learning.pdf",
      pages: "3",
      paragraph: "4",
      confidence: "95%",
      lastModified: "2026-07-21",
      referencedText: "Under supervised learning, model parameters align margins to match target classification tags, penalizing errors dynamically."
    },
    chunks: [
      {
        id: "chunk-6",
        document: "Machine_Learning.pdf",
        page: 3,
        paragraph: 4,
        similarity: 95,
        readingTime: "1.5 min",
        content: "Under <mark>supervised learning</mark>, model parameters align margins to match target classification tags, penalizing errors dynamically.",
        concepts: ["Supervised Learning", "Target Tags", "Margins"]
      }
    ],
    comparison: {
      term: "supervised learning explanation",
      keywordResult: "No exact match found for literal string 'explain supervised learning'.",
      semanticMatches: [
        { term: "supervised learning", weight: "95%" },
        { term: "target classification tags", weight: "93%" }
      ]
    },
    performance: {
      searchTime: 0.35,
      docsSearched: 5,
      chunksRetrieved: 3,
      pagesAnalyzed: 95,
      similarityScore: 95,
      speed: "Fast"
    }
  }
};
