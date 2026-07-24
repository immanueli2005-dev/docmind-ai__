// app.js - Main Application logic for DocMind AI SPA (Upgraded with ChatGPT-style Chat, RAG Search & Citations)

import { 
  mockDocuments, 
  mockActivities, 
  suggestedQuestions, 
  mockChatAnswers, 
  defaultMockAnswer,
  errorMockAnswer,
  mockConversations,
  mockRAGData
} from './mockData.js';

// Application State
const state = {
  currentUser: null,
  documents: [...mockDocuments],
  activities: [...mockActivities],
  conversations: [...mockConversations],
  activeConversationId: "chat-1",
  isDarkMode: false,
  libraryLayout: 'grid',
  libraryFilters: {
    search: '',
    type: 'all',
    sort: 'newest'
  },
  chatSearchQuery: '',
  uploadingFiles: [],
  // Upgraded Semantic Search state
  searchFilters: {
    documentId: 'all',
    minSimilarity: 80,
    fileType: 'all',
    sortBy: 'newest'
  },
  selectedSearchDocs: ['all'],
  selectedChatDocs: ['all'],
  activeSearchQuery: '',
  searchResults: null,
  isSearchLoading: false,
  recentSearches: ["Explain neural networks.", "Summarize Chapter 5", "What are the advantages of AI?", "List all algorithms", "Explain supervised learning"]
};

// Global DOM Helpers
const getEl = (id) => document.getElementById(id);
const queryAll = (selector) => document.querySelectorAll(selector);

// Show Toast Notifications
export function showToast(message, type = 'success') {
  const container = getEl('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  if (type === 'info') iconName = 'info';
  if (type === 'warning') iconName = 'alert-circle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon"></i>
    <div class="toast-content">${message}</div>
    <div class="toast-close">&times;</div>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  // Close event listener
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'slideInRight 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  });

  // Auto remove
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideInRight 0.3s reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// Router System
function handleRoute() {
  const hash = window.location.hash || '#landing';
  
  getEl('landingPage').classList.remove('active');
  getEl('authWrapper').classList.remove('active');
  getEl('appShell').classList.remove('active');
  
  queryAll('.app-content').forEach(el => el.style.display = 'none');
  queryAll('.sidebar-link').forEach(el => el.classList.remove('active'));
  queryAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));

  if (hash === '#landing') {
    getEl('landingPage').classList.add('active');
  } 
  else if (hash === '#login' || hash === '#signup' || hash === '#forgot-password') {
    getEl('authWrapper').classList.add('active');
    
    getEl('loginFormView').style.display = hash === '#login' ? 'block' : 'none';
    getEl('signupFormView').style.display = hash === '#signup' ? 'block' : 'none';
    getEl('forgotFormView').style.display = hash === '#forgot-password' ? 'block' : 'none';
  } 
  else {
    if (!state.currentUser) {
      state.currentUser = {
        name: "Immanuel Dev",
        email: "immanuel@docmind.ai",
        avatar: "ID"
      };
      updateUserUI();
    }
    
    getEl('appShell').classList.add('active');
    
    let activeSubPageId = '';
    let breadcrumbText = '';
    
    if (hash === '#dashboard') {
      activeSubPageId = 'dashboardHomeView';
      breadcrumbText = 'Overview';
      renderDashboardOverview();
    } else if (hash === '#upload') {
      activeSubPageId = 'uploadDocumentView';
      breadcrumbText = 'Upload Documents';
      renderUploadPage();
    } else if (hash === '#chat') {
      activeSubPageId = 'aiChatView';
      breadcrumbText = 'AI Chat Assistant';
      renderChatPage();
    } else if (hash === '#library') {
      activeSubPageId = 'documentLibraryView';
      breadcrumbText = 'Document Library';
      renderLibraryPage();
    } else if (hash === '#settings') {
      activeSubPageId = 'settingsView';
      breadcrumbText = 'Settings';
      renderSettingsPage();
    } else if (hash === '#search') {
      activeSubPageId = 'intelligentSearchView';
      breadcrumbText = 'Intelligent Search (RAG)';
      renderSearchPage();
    } else {
      activeSubPageId = 'error404View';
      breadcrumbText = 'Not Found';
    }

    const subPage = getEl(activeSubPageId);
    if (subPage) {
      subPage.style.display = 'block';
      subPage.classList.add('animated-fade-in');
    }

    const matchingLink = document.querySelector(`.sidebar-link[href="${hash}"]`);
    if (matchingLink) {
      matchingLink.classList.add('active');
    }
    
    const matchingMobileLink = document.querySelector(`.mobile-nav-item[href="${hash}"]`);
    if (matchingMobileLink) {
      matchingMobileLink.classList.add('active');
    }

    getEl('breadcrumbCurrent').textContent = breadcrumbText;
  }

  lucide.createIcons();
  window.scrollTo(0, 0);
}

// Update user details in the Sidebar UI
function updateUserUI() {
  if (state.currentUser) {
    getEl('sidebarUserName').textContent = state.currentUser.name;
    getEl('sidebarUserEmail').textContent = state.currentUser.email;
    getEl('sidebarAvatarText').textContent = state.currentUser.avatar;
    
    const pName = getEl('profileNameInput');
    const pEmail = getEl('profileEmailInput');
    if (pName) pName.value = state.currentUser.name;
    if (pEmail) pEmail.value = state.currentUser.email;
  }
}

// --- RENDER FUNCTIONS ---

// Dashboard Overview
function renderDashboardOverview() {
  getEl('totalDocsCount').textContent = state.documents.length;
  
  const totalPages = state.documents.reduce((acc, doc) => acc + doc.pages, 0);
  getEl('totalDocsPages').textContent = totalPages;
  
  const totalSize = state.documents.reduce((acc, doc) => acc + parseFloat(doc.size), 0).toFixed(1);
  getEl('totalDocsSize').textContent = `${totalSize} MB`;

  let questionCount = 0;
  state.conversations.forEach(c => {
    questionCount += c.messages.filter(msg => msg.sender === 'user').length;
  });
  getEl('questionsAskedCount').textContent = questionCount || "14";
  
  const activityList = getEl('dashboardActivityList');
  if (activityList) {
    if (state.activities.length === 0) {
      activityList.innerHTML = `<div class="empty-state"><p>No recent activity logs.</p></div>`;
    } else {
      activityList.innerHTML = state.activities.slice(0, 5).map(act => `
        <div class="activity-item ${act.type}">
          <div class="activity-dot"></div>
          <div class="activity-details">
            <p class="activity-desc">${act.description}</p>
            <div class="activity-time">${act.time}</div>
          </div>
        </div>
      `).join('');
    }
  }

  const recentTableBody = getEl('dashboardRecentUploadsTable');
  if (recentTableBody) {
    if (state.documents.length === 0) {
      recentTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px;">No documents available. Go to Upload.</td></tr>`;
    } else {
      recentTableBody.innerHTML = state.documents.slice(0, 4).map(doc => `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px; font-weight:600;">
              <i data-lucide="${getFileIcon(doc.type)}" style="width:16px; height:16px; color:var(--text-muted);"></i>
              <span>${doc.name}</span>
            </div>
          </td>
          <td>${doc.uploadDate}</td>
          <td>${doc.pages}</td>
          <td>${doc.size}</td>
          <td><span class="badge badge-success">${doc.status}</span></td>
        </tr>
      `).join('');
    }
  }
}

// Upload Page
function renderUploadPage() {
  const uploadList = getEl('uploadFilesProgressList');
  const uploadedFilesList = getEl('uploadedDocsTableBody');

  if (uploadList) {
    if (state.uploadingFiles.length === 0) {
      uploadList.innerHTML = '';
    } else {
      uploadList.innerHTML = state.uploadingFiles.map(file => `
        <div class="progress-item animated-fade-in" id="prog-${file.id}">
          <i data-lucide="${getFileIcon(file.extension)}" style="width:24px; height:24px; color:var(--color-blue);"></i>
          <div class="progress-file-info">
            <div class="progress-file-header">
              <span>${file.name} (${file.sizeStr})</span>
              <span>${file.progress}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${file.progress}%"></div>
            </div>
          </div>
          <button class="file-action-btn delete" onclick="cancelUpload('${file.id}')">
            <i data-lucide="x" style="width:16px; height:16px;"></i>
          </button>
        </div>
      `).join('');
    }
  }

  if (uploadedFilesList) {
    if (state.documents.length === 0) {
      uploadedFilesList.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px; color:var(--text-muted);">No documents uploaded yet.</td></tr>`;
    } else {
      uploadedFilesList.innerHTML = state.documents.map(doc => `
        <tr class="animated-fade-in">
          <td>
            <div style="display:flex; align-items:center; gap:10px; font-weight: 600;">
              <i data-lucide="${getFileIcon(doc.type)}" style="width:16px; height:16px; color:var(--text-muted);"></i>
              <span>${doc.name}</span>
            </div>
          </td>
          <td>${doc.pages}</td>
          <td>${doc.size}</td>
          <td><span class="badge badge-success">${doc.status}</span></td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="file-action-btn" title="Preview document" onclick="openSourcePage('${doc.name}', 1)">
                <i data-lucide="eye" style="width:16px; height:16px;"></i>
              </button>
              <button class="file-action-btn" title="Rename" onclick="renameDocument('${doc.id}')">
                <i data-lucide="edit-3" style="width:16px; height:16px;"></i>
              </button>
              <button class="file-action-btn delete" title="Delete" onclick="deleteDocument('${doc.id}')">
                <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  }
}

// AI Chat Page
function renderChatPage() {
  const sidebarScroll = getEl('chatHistoryScroll');
  const messagesContainer = getEl('chatMessagesContainer');
  const headerDocName = getEl('chatHeaderDocName');
  const headerDocMeta = getEl('chatHeaderDocMeta');
  const noticeBar = getEl('chatNoticeAlert');
  const textInput = getEl('chatInput');
  const submitBtn = getEl('chatSubmitBtn');

  if (state.documents.length === 0) {
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="empty-state" style="margin: auto; max-width: 440px;">
          <div class="empty-state-icon"><i data-lucide="file-warning" style="width:32px; height:32px;"></i></div>
          <h4>No documents uploaded yet</h4>
          <p>Please upload document assets in the upload tab to begin interacting with the AI.</p>
          <a href="#upload" class="btn btn-primary">Upload Documents</a>
        </div>
      `;
    }
    if (sidebarScroll) sidebarScroll.innerHTML = `<div style="padding:16px; font-size:0.8rem; color:var(--text-muted); text-align:center;">No files available.</div>`;
    if (headerDocName) headerDocName.textContent = "No Context";
    if (headerDocMeta) headerDocMeta.textContent = "AI Status: Offline";
    if (noticeBar) noticeBar.style.display = 'none';
    if (textInput) textInput.disabled = true;
    if (submitBtn) submitBtn.disabled = true;
    lucide.createIcons();
    return;
  }

  if (textInput) textInput.disabled = false;

  // Build Multi-document selectors list in chat
  buildMultiDocList('chat');

  if (sidebarScroll) {
    let threads = state.conversations.filter(c => 
      c.title.toLowerCase().includes(state.chatSearchQuery.toLowerCase()) ||
      c.documentName.toLowerCase().includes(state.chatSearchQuery.toLowerCase())
    );

    const groups = {
      "Today": [],
      "Yesterday": [],
      "Previous 7 Days": [],
      "Previous Month": []
    };

    threads.forEach(thread => {
      const g = thread.dateGroup || "Today";
      if (groups[g]) groups[g].push(thread);
    });

    let sidebarHtml = '';
    
    Object.keys(groups).forEach(groupName => {
      const list = groups[groupName];
      if (list.length > 0) {
        sidebarHtml += `
          <div class="chat-history-group">
            <div class="chat-group-title">${groupName}</div>
            ${list.map(t => `
              <div class="chat-thread-card ${t.id === state.activeConversationId ? 'active' : ''}" onclick="selectChatThread('${t.id}')">
                <div class="chat-thread-info">
                  <div class="chat-thread-title" title="${t.title}">${t.title}</div>
                  <div class="chat-thread-meta">${t.documentName}</div>
                </div>
                <div class="chat-thread-actions">
                  <button class="chat-thread-btn" title="Rename" onclick="event.stopPropagation(); renameChatThread('${t.id}')">
                    <i data-lucide="edit-2" style="width:12px; height:12px;"></i>
                  </button>
                  <button class="chat-thread-btn delete" title="Delete" onclick="event.stopPropagation(); deleteChatThread('${t.id}')">
                    <i data-lucide="trash" style="width:12px; height:12px;"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    });

    if (threads.length === 0) {
      sidebarHtml = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding: 24px 0;">No matching chat threads.</div>`;
    }

    sidebarScroll.innerHTML = sidebarHtml;
  }

  const activeThread = state.conversations.find(c => c.id === state.activeConversationId);
  
  if (!activeThread) {
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="message-square" style="width:32px; height:32px;"></i></div>
          <h4>Welcome back</h4>
          <p>Please select an existing chat thread or start a new chat to begin analysis.</p>
          <button class="btn btn-primary" onclick="createNewChat()">New Chat</button>
        </div>
      `;
    }
    if (headerDocName) headerDocName.textContent = "No Chat Active";
    if (headerDocMeta) headerDocMeta.textContent = "Ready";
    if (noticeBar) noticeBar.style.display = 'none';
    lucide.createIcons();
    return;
  }

  const activeDoc = state.documents.find(d => d.id === activeThread.documentId);
  if (activeDoc) {
    if (headerDocName) headerDocName.textContent = activeThread.documentName;
    if (headerDocMeta) headerDocMeta.textContent = `Context: ${activeDoc.pages} Pages &bull; Updated: ${activeDoc.uploadDate}`;
    if (noticeBar) {
      noticeBar.style.display = 'flex';
      noticeBar.innerHTML = `<i data-lucide="info" style="width:14px; color:var(--color-blue);"></i> Answers are generated only from your uploaded documents.`;
    }
  } else {
    if (headerDocName) headerDocName.textContent = activeThread.documentName;
    if (headerDocMeta) headerDocMeta.textContent = "Warning: Reference file deleted from library";
    if (noticeBar) {
      noticeBar.style.display = 'flex';
      noticeBar.innerHTML = `<i data-lucide="alert-triangle" style="width:14px; color:var(--color-danger);"></i> Selected document is missing. AI will operate with cached answers only.`;
    }
  }

  if (messagesContainer) {
    if (activeThread.messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="suggested-prompts-container animated-fade-in">
          <div class="chat-brand-icon"><i data-lucide="brain-circuit" style="width:28px; height:28px;"></i></div>
          <h3 class="suggested-title">Chat with ${activeThread.documentName}</h3>
          <p class="suggested-desc">Ask specific questions, request summaries, or let our AI extract insights from this file.</p>
          <div class="suggested-cards-grid">
            ${suggestedQuestions.map(q => `
              <div class="suggested-prompt-card" onclick="sendSuggestedQuestion('${q.replace(/'/g, "\\'")}')">
                <span>${q}</span>
                <i data-lucide="arrow-right" style="width:14px; height:14px;"></i>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      messagesContainer.innerHTML = activeThread.messages.map(msg => {
        if (msg.sender === 'user') {
          return `
            <div class="message-bubble user">
              <div class="message-avatar">U</div>
              <div class="message-details-wrapper">
                <div class="message-bubble-content">
                  <p>${msg.content}</p>
                </div>
                <span class="message-timestamp">${msg.timestamp}</span>
              </div>
            </div>
          `;
        } else {
          const citation = msg.citation || { document: "N/A", pages: "N/A", paragraph: "N/A", confidence: "0%", lastModified: "N/A", referencedText: "" };
          return `
            <div class="message-bubble assistant">
              <div class="message-avatar">AI</div>
              <div class="message-details-wrapper">
                <div class="ai-card-response">
                  
                  <div class="ai-card-section">
                    <div class="ai-card-section-label">Answer</div>
                    <div class="ai-card-answer">${parseMessageMarkdown(msg.content)}</div>
                  </div>

                  <!-- Quoted text box -->
                  ${citation.referencedText ? `
                    <div class="citation-verified-badge"><i data-lucide="check-circle" style="width:12px; color:var(--color-success);"></i> Verified from Uploaded Documents</div>
                    <div class="referenced-text-box">
                      "${citation.referencedText}"
                    </div>
                  ` : ''}

                  <!-- Citation details grid (Page, Paragraph, Conf, Last Mod) -->
                  <div class="citation-meta-row">
                    <div class="citation-meta-cell">
                      <div class="citation-meta-lbl">Document</div>
                      <div class="citation-meta-val" title="${citation.document}">${citation.document}</div>
                    </div>
                    <div class="citation-meta-cell">
                      <div class="citation-meta-lbl">Page</div>
                      <div class="citation-meta-val">${citation.pages}</div>
                    </div>
                    <div class="citation-meta-cell">
                      <div class="citation-meta-lbl">Paragraph</div>
                      <div class="citation-meta-val">${citation.paragraph}</div>
                    </div>
                    <div class="citation-meta-cell">
                      <div class="citation-meta-lbl">Confidence</div>
                      <div class="citation-meta-val" style="color:var(--color-success);">${citation.confidence}</div>
                    </div>
                    <div class="citation-meta-cell">
                      <div class="citation-meta-lbl">Modified</div>
                      <div class="citation-meta-val">${citation.lastModified}</div>
                    </div>
                  </div>

                  <!-- Actions for Citations -->
                  <div class="citation-actions-flex">
                    <button class="citation-action-btn" onclick="openSourcePage('${citation.document}', '${citation.pages}')">
                      <i data-lucide="eye" style="width:12px;"></i> Open Source Page
                    </button>
                    <button class="citation-action-btn" onclick="viewHighlightedText('chunk-1')">
                      <i data-lucide="highlighter" style="width:12px;"></i> View Highlighted Text
                    </button>
                  </div>

                </div>

                <div class="message-hover-actions">
                  <button class="msg-action-btn" title="Copy answer" onclick="copyMessageText('${msg.id}')">
                    <i data-lucide="copy" style="width:12px; height:12px;"></i> Copy
                  </button>
                  <button class="msg-action-btn" id="like-${msg.id}" title="Upvote" onclick="rateMessage('${msg.id}', 'like')">
                    <i data-lucide="thumbs-up" style="width:12px; height:12px;"></i>
                  </button>
                  <button class="msg-action-btn" id="dislike-${msg.id}" title="Downvote" onclick="rateMessage('${msg.id}', 'dislike')">
                    <i data-lucide="thumbs-down" style="width:12px; height:12px;"></i>
                  </button>
                  <button class="msg-action-btn" title="Regenerate (UI only)" onclick="showToast('Regenerating response simulation...', 'info')">
                    <i data-lucide="rotate-ccw" style="width:12px; height:12px;"></i> Regenerate
                  </button>
                </div>
                
                <span class="message-timestamp">${msg.timestamp}</span>
              </div>
            </div>
          `;
        }
      }).join('');
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  validateChatSendButton();
  lucide.createIcons();
}

function parseMessageMarkdown(text) {
  return text
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n- (.*)/g, "<li>$1</li>")
    .replace(/<li>(.*)<\/li>/g, "<ul><li>$1</li></ul>")
    .replace(/<\/ul><ul>/g, "")
    .replace(/\n\d\. (.*)/g, "<li>$1</li>")
    .replace(/<li>(.*)<\/li>/g, "<ol><li>$1</li></ol>")
    .replace(/<\/ol><ol>/g, "")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\`(.*?)\`/g, "<code>$1</code>");
}

// Document Library Page
function renderLibraryPage() {
  const container = getEl('libraryDocsContainer');
  if (!container) return;

  container.className = `library-container ${state.libraryLayout}`;
  
  if (state.libraryLayout === 'grid') {
    getEl('layoutGridBtn').classList.add('active');
    getEl('layoutListBtn').classList.remove('active');
  } else {
    getEl('layoutGridBtn').classList.remove('active');
    getEl('layoutListBtn').classList.add('active');
  }

  let filtered = state.documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(state.libraryFilters.search.toLowerCase());
    const matchesType = state.libraryFilters.type === 'all' || doc.type === state.libraryFilters.type;
    return matchesSearch && matchesType;
  });

  filtered.sort((a, b) => {
    if (state.libraryFilters.sort === 'newest') {
      return new Date(b.uploadDate) - new Date(a.uploadDate);
    } else if (state.libraryFilters.sort === 'oldest') {
      return new Date(a.uploadDate) - new Date(b.uploadDate);
    } else if (state.libraryFilters.sort === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; width:100%; padding:80px 0;">
        <div class="empty-state-icon"><i data-lucide="file" style="width:32px; height:32px;"></i></div>
        <h4>No Documents Found</h4>
        <p>Try searching for a different keyword or adjust your filters.</p>
        <button class="btn btn-primary" onclick="window.location.hash='#upload'">Upload Document</button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  if (state.libraryLayout === 'grid') {
    container.innerHTML = filtered.map(doc => `
      <div class="card file-card animated-fade-in">
        <div class="file-card-preview">
          <i data-lucide="${getFileIcon(doc.type)}" style="width:32px; height:32px; color:var(--text-muted);"></i>
        </div>
        <div class="file-card-info">
          <div class="file-card-name" title="${doc.name}">${doc.name}</div>
          <div class="file-card-meta">
            <span>${doc.pages} pages</span>
            <span>&bull;</span>
            <span>${doc.size}</span>
          </div>
        </div>
        <div class="file-card-actions">
          <button class="file-action-btn" title="Open Chat" onclick="openDocChat('${doc.id}')">
            <i data-lucide="message-square" style="width:14px; height:14px;"></i>
          </button>
          <button class="file-action-btn" title="Preview document" onclick="openSourcePage('${doc.name}', 1)">
            <i data-lucide="eye" style="width:14px; height:14px;"></i>
          </button>
          <button class="file-action-btn" title="Rename" onclick="renameDocument('${doc.id}')">
            <i data-lucide="edit-3" style="width:14px; height:14px;"></i>
          </button>
          <button class="file-action-btn delete" title="Delete" onclick="deleteDocument('${doc.id}')">
            <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
          </button>
        </div>
      </div>
    `).join('');
  } else {
    container.innerHTML = filtered.map(doc => `
      <div class="card file-card animated-fade-in">
        <div class="file-card-preview">
          <i data-lucide="${getFileIcon(doc.type)}" style="width:18px; height:18px; color:var(--text-muted);"></i>
        </div>
        <div class="file-card-info">
          <div class="file-card-name" style="margin-bottom:0;" title="${doc.name}">${doc.name}</div>
          <div class="file-card-meta-wrapper">
            <div class="file-card-meta">
              <span>${doc.pages} pages</span>
              <span>&bull;</span>
              <span>${doc.size}</span>
              <span>&bull;</span>
              <span>Uploaded: ${doc.uploadDate}</span>
            </div>
            <div class="file-card-actions" style="margin-top:0;">
              <button class="file-action-btn" title="Open Chat" onclick="openDocChat('${doc.id}')">
                <i data-lucide="message-square" style="width:14px; height:14px;"></i>
              </button>
              <button class="file-action-btn" title="Preview document" onclick="openSourcePage('${doc.name}', 1)">
                <i data-lucide="eye" style="width:14px; height:14px;"></i>
              </button>
              <button class="file-action-btn" title="Rename" onclick="renameDocument('${doc.id}')">
                <i data-lucide="edit-3" style="width:14px; height:14px;"></i>
              </button>
              <button class="file-action-btn delete" title="Delete" onclick="deleteDocument('${doc.id}')">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
  lucide.createIcons();
}

// Settings Page
function renderSettingsPage() {
  getEl('profileNameInput').value = state.currentUser.name;
  getEl('profileEmailInput').value = state.currentUser.email;
  getEl('settingsDarkModeToggle').checked = state.isDarkMode;
}

// Helper to resolve file icon strings
function getFileIcon(type) {
  if (type === 'pdf') return 'file-text';
  if (type === 'docx') return 'file-edit';
  return 'file-code';
}

// --- UPGRADED CHAT CONTROLLER ACTIONS ---

window.selectChatThread = function(threadId) {
  state.activeConversationId = threadId;
  renderChatPage();
};

window.createNewChat = function() {
  if (state.documents.length === 0) {
    showToast("Please upload at least one document to start a new chat.", "warning");
    return;
  }

  const defaultDoc = state.documents[0];
  const threadId = `chat-${Date.now()}`;
  
  const newThread = {
    id: threadId,
    title: `Chat Session ${state.conversations.length + 1}`,
    documentId: defaultDoc.id,
    documentName: defaultDoc.name,
    dateGroup: "Today",
    date: new Date().toISOString().split('T')[0],
    messages: []
  };

  state.conversations.unshift(newThread);
  state.activeConversationId = threadId;
  
  showToast("New chat thread started", "success");
  renderChatPage();
};

window.renameChatThread = function(threadId) {
  const thread = state.conversations.find(t => t.id === threadId);
  if (!thread) return;

  const newTitle = prompt(`Enter a new title for this chat:`, thread.title);
  if (newNameValidation(newTitle, thread.title)) {
    thread.title = newTitle.trim();
    showToast("Conversation renamed", "success");
    renderChatPage();
  }
};

function newNameValidation(val, original) {
  return val && val.trim() !== "" && val !== original;
}

window.deleteChatThread = function(threadId) {
  const thread = state.conversations.find(t => t.id === threadId);
  if (!thread) return;

  if (confirm(`Delete conversation "${thread.title}"?`)) {
    state.conversations = state.conversations.filter(t => t.id !== threadId);
    
    if (state.activeConversationId === threadId) {
      state.activeConversationId = state.conversations.length > 0 ? state.conversations[0].id : null;
    }
    
    showToast("Conversation deleted", "error");
    renderChatPage();
  }
};

window.onChatSearch = function(val) {
  state.chatSearchQuery = val;
  renderChatPage();
};

window.clearActiveChat = function() {
  const activeThread = state.conversations.find(c => c.id === state.activeConversationId);
  if (!activeThread) return;

  if (confirm("Are you sure you want to clear this conversation's history?")) {
    activeThread.messages = [];
    showToast("Chat cleared", "info");
    renderChatPage();
  }
};

window.exportActiveChat = function() {
  const activeThread = state.conversations.find(c => c.id === state.activeConversationId);
  if (!activeThread || activeThread.messages.length === 0) {
    showToast("Nothing to export yet.", "warning");
    return;
  }

  let textContent = `DocMind AI - Conversation Export\n`;
  textContent += `Title: ${activeThread.title}\n`;
  textContent += `Document Context: ${activeThread.documentName}\n`;
  textContent += `Date: ${activeThread.date}\n`;
  textContent += `==============================================\n\n`;

  activeThread.messages.forEach(msg => {
    if (msg.sender === 'user') {
      textContent += `[${msg.timestamp}] USER:\n${msg.content}\n\n`;
    } else {
      const citation = msg.citation || {};
      textContent += `[${msg.timestamp}] DOCMIND AI:\n${msg.content}\n`;
      textContent += `[Source: ${citation.document} | Pages: ${citation.pages} | Confidence: ${citation.confidence}]\n\n`;
    }
  });

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `docmind_chat_export_${activeThread.id}.txt`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Chat exported successfully!", "success");
};

window.copyMessageText = function(msgId) {
  const activeThread = state.conversations.find(c => c.id === state.activeConversationId);
  if (!activeThread) return;

  const msg = activeThread.messages.find(m => m.id === msgId);
  if (!msg) return;

  navigator.clipboard.writeText(msg.content).then(() => {
    showToast("Response copied to clipboard!", "success");
  }).catch(() => {
    showToast("Copy failed", "error");
  });
};

window.rateMessage = function(msgId, ratingType) {
  const likeBtn = getEl(`like-${msgId}`);
  const dislikeBtn = getEl(`dislike-${msgId}`);

  if (ratingType === 'like') {
    likeBtn.classList.toggle('active');
    dislikeBtn.classList.remove('active');
    if (likeBtn.classList.contains('active')) {
      showToast("Response upvoted! Thank you for the feedback.", "success");
    }
  } else {
    dislikeBtn.classList.toggle('active');
    likeBtn.classList.remove('active');
    if (dislikeBtn.classList.contains('active')) {
      showToast("Response downvoted. We will improve our reference indexes.", "warning");
    }
  }
};

window.submitChatMessage = function(event) {
  if (event) event.preventDefault();
  
  const textInput = getEl('chatInput');
  const query = textInput.value.trim();
  if (query === "") return;

  const activeThread = state.conversations.find(c => c.id === state.activeConversationId);
  if (!activeThread) {
    showToast("No active conversation thread selected.", "error");
    return;
  }

  const userMsgId = `msg-user-${Date.now()}`;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  activeThread.messages.push({
    id: userMsgId,
    sender: 'user',
    content: query,
    timestamp: timeStr
  });

  textInput.value = "";
  textInput.style.height = "auto";
  validateChatSendButton();
  renderChatPage();

  const messagesContainer = getEl('chatMessagesContainer');
  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'message-bubble assistant loading-bubble';
  loadingBubble.innerHTML = `
    <div class="message-avatar">AI</div>
    <div class="message-details-wrapper">
      <div class="ai-card-response" style="max-width: 140px; padding: 12px 18px;">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
  messagesContainer.appendChild(loadingBubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  setTimeout(() => {
    const loader = messagesContainer.querySelector('.loading-bubble');
    if (loader) loader.remove();

    const lookupKey = query.toLowerCase().replace(/[?.,]/g, "").trim();
    let responseObj = mockChatAnswers[lookupKey];

    if (!responseObj) {
      if (lookupKey.includes("neural network") && activeThread.documentName !== "Machine_Learning.pdf") {
        responseObj = errorMockAnswer;
      } else {
        responseObj = { ...defaultMockAnswer };
        responseObj.citation.document = activeThread.documentName;
      }
    }

    activeThread.messages.push({
      id: `msg-ai-${Date.now()}`,
      sender: 'assistant',
      content: responseObj.content,
      citation: responseObj.citation,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    renderChatPage();
    showToast("AI response generated", "success");
  }, 1400);
};

window.sendSuggestedQuestion = function(text) {
  const textInput = getEl('chatInput');
  if (textInput) {
    textInput.value = text;
    submitChatMessage();
  }
};

window.validateChatSendButton = function() {
  const textInput = getEl('chatInput');
  const submitBtn = getEl('chatSubmitBtn');
  if (textInput && submitBtn) {
    const empty = textInput.value.trim() === "";
    submitBtn.disabled = empty;
  }
};

// --- INTELLIGENT SEARCH (RAG) CONTROLLER ACTIONS ---

function buildMultiDocList(section) {
  const selectList = getEl(`${section}MultiDocSelectList`);
  if (!selectList) return;

  const targetArray = section === 'search' ? state.selectedSearchDocs : state.selectedChatDocs;

  let dropdownHtml = `
    <div class="multi-doc-item" onclick="event.stopPropagation(); toggleDocSelection('${section}', 'all', event)">
      <input type="checkbox" class="multi-doc-checkbox ${section}-doc-checkbox" value="all" ${targetArray.includes('all') ? 'checked' : ''} onchange="toggleDocSelection('${section}', 'all', event)">
      <span>All Documents</span>
    </div>
  `;

  state.documents.forEach(doc => {
    const isChecked = targetArray.includes(doc.id);
    dropdownHtml += `
      <div class="multi-doc-item" onclick="event.stopPropagation(); toggleDocSelection('${section}', '${doc.id}', event)">
        <input type="checkbox" class="multi-doc-checkbox ${section}-doc-checkbox" value="${doc.id}" ${isChecked ? 'checked' : ''} onchange="toggleDocSelection('${section}', '${doc.id}', event)">
        <span>${doc.name}</span>
      </div>
    `;
  });

  selectList.innerHTML = dropdownHtml;
}

window.toggleMultiDocDropdown = function(section) {
  const list = getEl(`${section}MultiDocSelectList`);
  if (list) list.classList.toggle('open');
};

window.toggleDocSelection = function(section, docId, event) {
  // Prevent double trigger if clicking item wrapper vs directly checking box
  let isChecked;
  if (event.target.tagName === 'INPUT') {
    isChecked = event.target.checked;
  } else {
    const cb = event.currentTarget.querySelector('input');
    cb.checked = !cb.checked;
    isChecked = cb.checked;
  }

  let targetArray = section === 'search' ? state.selectedSearchDocs : state.selectedChatDocs;
  
  if (docId === 'all') {
    if (isChecked) {
      targetArray = ['all'];
    } else {
      targetArray = [];
    }
  } else {
    // Remove 'all'
    targetArray = targetArray.filter(id => id !== 'all');
    if (isChecked) {
      targetArray.push(docId);
    } else {
      targetArray = targetArray.filter(id => id !== docId);
    }
    if (targetArray.length === 0) {
      targetArray = ['all'];
    }
  }
  
  if (section === 'search') {
    state.selectedSearchDocs = targetArray;
  } else {
    state.selectedChatDocs = targetArray;
  }
  
  // Update button text
  const btnText = getEl(`${section}MultiDocBtnText`);
  if (btnText) {
    if (targetArray.includes('all')) {
      btnText.textContent = "All Documents Selected";
    } else {
      btnText.textContent = `${targetArray.length} Document(s) Selected`;
    }
  }
  
  buildMultiDocList(section);
};

// Search Page Render
function renderSearchPage() {
  const resultsContainer = getEl('searchResultsBox');

  // If no documents exist in the workspace, render empty state on Search too
  if (state.documents.length === 0) {
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="empty-state" style="padding: 60px 24px;">
          <div class="empty-state-icon"><i data-lucide="search" style="width:32px; height:32px;"></i></div>
          <h4>No documents available for semantic search</h4>
          <p>Please upload PDF, Word or text document assets first to build semantic indexes.</p>
          <a href="#upload" class="btn btn-primary">Upload Documents</a>
        </div>
      `;
    }
    lucide.createIcons();
    return;
  }

  // Populate Document filters select list dropdown options
  buildMultiDocList('search');

  // Populate Recent Searches grid
  const recentSearchesContainer = getEl('recentSearchesGrid');
  if (recentSearchesContainer) {
    recentSearchesContainer.innerHTML = state.recentSearches.slice(0, 5).map(q => `
      <div class="recent-search-card animated-fade-in" onclick="sendSemanticQuery('${q.replace(/'/g, "\\'")}')">
        <i data-lucide="history" style="width:14px; height:14px; color:var(--text-muted);"></i>
        <span>${q}</span>
      </div>
    `).join('');
  }

  // Render main output views based on state
  if (resultsContainer) {
    if (state.isSearchLoading) {
      return; // Handled directly inside trigger interval loop
    }

    if (!state.searchResults) {
      resultsContainer.innerHTML = `
        <div style="text-align:center; padding: 60px 0; color: var(--text-secondary);">
          <div style="font-size:3rem; margin-bottom: 20px;"><i data-lucide="search-check" style="width:48px; height:48px; color:var(--color-blue);"></i></div>
          <h4 style="font-weight: 700; margin-bottom: 8px;">Semantic Vector Search Ready</h4>
          <p style="font-size: 0.9rem; max-width: 320px; margin: 0 auto;">Type a question above or select a sample prompt to query the vector database.</p>
        </div>
      `;
    } else {
      const matches = state.searchResults;

      if (matches.empty) {
        resultsContainer.innerHTML = `
          <div class="empty-state" style="padding:40px 0;">
            <div class="empty-state-icon" style="background-color:rgba(239, 68, 68, 0.08); color:var(--color-danger);"><i data-lucide="alert-circle" style="width:32px; height:32px;"></i></div>
            <h4>No relevant information found</h4>
            <p>${matches.message || "We couldn't locate context groundings matching this query."}</p>
            <div style="display:flex; gap:12px; justify-content:center; margin-top:10px;">
              <button class="btn btn-secondary" onclick="clearSemanticSearch()">Try different wording</button>
              <a href="#upload" class="btn btn-primary">Upload more documents</a>
            </div>
          </div>
        `;
      } else {
        const citation = matches.citation || {};
        const comp = matches.comparison || {};
        const metrics = matches.performance || { searchTime: 0.42, docsSearched: 5, chunksRetrieved: 8, pagesAnalyzed: 142, similarityScore: 98, speed: "Fast" };
        
        let chunkCardsHtml = matches.chunks.map(chunk => `
          <div class="result-card animated-fade-in" id="${chunk.id}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="badge badge-info" style="font-weight:600;"><i data-lucide="file-text" style="width:12px; margin-right:4px;"></i> ${chunk.document}</span>
              <div style="display:flex; align-items:center; gap:12px; font-size:0.75rem; color:var(--text-muted);">
                <span>Page ${chunk.page}</span>
                <span>&bull;</span>
                <span>Paragraph ${chunk.paragraph}</span>
                <span>&bull;</span>
                <span>${chunk.readingTime} read</span>
                <span>&bull;</span>
                <span style="font-weight:700; color:var(--color-blue);">${chunk.similarity}% match</span>
              </div>
            </div>
            
            <p style="font-size:0.9rem; line-height:1.5; color:var(--text-secondary);">${chunk.content}</p>
            
            <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid var(--border-color); padding-top:8px;">
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                ${chunk.concepts ? chunk.concepts.map(con => `<span class="badge badge-success" style="font-size:0.65rem; font-weight:700;">${con}</span>`).join('') : ''}
              </div>
              <button class="citation-action-btn" style="padding:4px 8px; font-size:0.7rem;" onclick="openSourcePage('${chunk.document}', ${chunk.page})">
                <i data-lucide="eye" style="width:10px;"></i> Preview Page
              </button>
            </div>
          </div>
        `).join('');

        if (matches.chunks.length === 0) {
          chunkCardsHtml = `
            <div style="padding:16px; border: 1px dashed var(--border-color); border-radius: var(--radius-md); text-align:center; color:var(--text-muted); font-size:0.85rem;">
              Chunks below ${state.searchFilters.minSimilarity}% match filtered out. Try lowering the similarity threshold.
            </div>
          `;
        }

        resultsContainer.innerHTML = `
          <!-- RAG search flowchart visual cards -->
          <div class="rag-flow-card animated-fade-in" style="margin-bottom: 24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <div class="filter-title" style="margin-bottom:0;">RAG Processing Workflow</div>
              <span class="badge" style="background-color:rgba(79, 70, 229, 0.1); color:var(--color-blue); font-weight:700;">Optimized for Instant Results</span>
            </div>
            
            <div class="rag-flowchart-grid">
              <div class="rag-flowchart-card">
                <div class="rag-flowchart-icon"><i data-lucide="file-up" style="width:16px;"></i></div>
                <div class="rag-flowchart-step">Step 1</div>
                <div class="rag-flowchart-title">Document Processing</div>
              </div>
              <div class="rag-flowchart-card">
                <div class="rag-flowchart-icon"><i data-lucide="scissors" style="width:16px;"></i></div>
                <div class="rag-flowchart-step">Step 2</div>
                <div class="rag-flowchart-title">Text Chunking</div>
              </div>
              <div class="rag-flowchart-card">
                <div class="rag-flowchart-icon"><i data-lucide="key" style="width:16px;"></i></div>
                <div class="rag-flowchart-step">Step 3</div>
                <div class="rag-flowchart-title">Embedding Gen</div>
              </div>
              <div class="rag-flowchart-card">
                <div class="rag-flowchart-icon"><i data-lucide="search" style="width:16px;"></i></div>
                <div class="rag-flowchart-step">Step 4</div>
                <div class="rag-flowchart-title">Vector Search</div>
              </div>
              <div class="rag-flowchart-card">
                <div class="rag-flowchart-icon"><i data-lucide="check-square" style="width:16px;"></i></div>
                <div class="rag-flowchart-step">Step 5</div>
                <div class="rag-flowchart-title">Paragraph Retrieve</div>
              </div>
              <div class="rag-flowchart-card">
                <div class="rag-flowchart-icon"><i data-lucide="sparkles" style="width:16px;"></i></div>
                <div class="rag-flowchart-step">Step 6</div>
                <div class="rag-flowchart-title">Answer Gen</div>
              </div>
            </div>
          </div>

          <!-- RAG search metrics panel -->
          <div class="rag-flow-card animated-fade-in" style="margin-bottom: 24px; padding:20px;">
            <div class="filter-title" style="margin-bottom:12px;">Search Performance Metrics</div>
            <div class="performance-metrics-grid">
              <div class="performance-card">
                <div class="performance-val">${metrics.searchTime}s</div>
                <div class="performance-lbl">Search Time</div>
              </div>
              <div class="performance-card">
                <div class="performance-val">${metrics.docsSearched}</div>
                <div class="performance-lbl">Docs Searched</div>
              </div>
              <div class="performance-card">
                <div class="performance-val">${metrics.chunksRetrieved}</div>
                <div class="performance-lbl">Chunks Retrieved</div>
              </div>
              <div class="performance-card">
                <div class="performance-val">${metrics.pagesAnalyzed}</div>
                <div class="performance-lbl">Pages Analyzed</div>
              </div>
              <div class="performance-card">
                <div class="performance-val" style="color:var(--color-success);">${metrics.similarityScore}%</div>
                <div class="performance-lbl">Similarity Score</div>
              </div>
              <div class="performance-card">
                <div class="performance-val" style="color:var(--color-blue);">${metrics.speed}</div>
                <div class="performance-lbl">Response Speed</div>
              </div>
            </div>
          </div>

          <!-- Side by side comparison widget -->
          <div class="comparison-grid animated-fade-in" style="margin-bottom: 24px;">
            <!-- traditional keyword search -->
            <div class="card comparison-card">
              <div class="comparison-header">
                <span class="comparison-title">Traditional Keyword Search</span>
                <span class="badge" style="background-color:rgba(239, 68, 68, 0.1); color:var(--color-danger); font-weight:700;">String Match</span>
              </div>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">Searched: "${comp.term}"</p>
              <div class="comparison-val-item" style="color:var(--color-danger); border-color:rgba(239, 68, 68, 0.2); background-color:rgba(239,68,68,0.02);">
                <span>${comp.keywordResult}</span>
                <i data-lucide="alert-circle" style="width:16px;"></i>
              </div>
            </div>
            
            <!-- semantic search -->
            <div class="card comparison-card">
              <div class="comparison-header">
                <span class="comparison-title">Semantic Search (RAG)</span>
                <span class="badge" style="background-color:rgba(16, 185, 129, 0.1); color:var(--color-success); font-weight:700;">Meaning Successfully Matched</span>
              </div>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">Concept matched via embeddings vector distance:</p>
              <div class="comparison-val-list">
                ${comp.semanticMatches ? comp.semanticMatches.map(m => `
                  <div class="comparison-val-item">
                    <span>${m.term}</span>
                    <span style="color:var(--color-success); font-weight:700;">${m.weight} match</span>
                  </div>
                `).join('') : ''}
              </div>
            </div>
          </div>

          <!-- RAG Answer Panel Card -->
          <div class="answer-rag-card animated-fade-in" style="margin-bottom: 24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
              <span class="badge-rag"><i data-lucide="sparkles"></i> AI RAG Answer</span>
              <span class="citation-verified-badge" style="margin-bottom:0;"><i data-lucide="check-circle" style="width:12px; color:var(--color-success);"></i> Verified from Uploaded Documents</span>
            </div>
            
            <p style="font-size:0.95rem; line-height:1.6; color:var(--text-primary); margin-bottom:14px;">
              ${matches.answer}
            </p>

            <!-- Referenced Quoted text box -->
            <div class="referenced-text-box">
              "${citation.referencedText}"
            </div>

            <!-- Metadata table block -->
            <div class="citation-meta-row" style="margin-top:14px;">
              <div class="citation-meta-cell">
                <div class="citation-meta-lbl">Document</div>
                <div class="citation-meta-val" title="${citation.document}">${citation.document}</div>
              </div>
              <div class="citation-meta-cell">
                <div class="citation-meta-lbl">Page</div>
                <div class="citation-meta-val">${citation.pages}</div>
              </div>
              <div class="citation-meta-cell">
                <div class="citation-meta-lbl">Paragraph</div>
                <div class="citation-meta-val">${citation.paragraph}</div>
              </div>
              <div class="citation-meta-cell">
                <div class="citation-meta-lbl">Confidence</div>
                <div class="citation-meta-val" style="color:var(--color-success);">${citation.confidence}</div>
              </div>
              <div class="citation-meta-cell">
                <div class="citation-meta-lbl">Modified</div>
                <div class="citation-meta-val">${citation.lastModified}</div>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid var(--border-color); padding-top:14px; font-size:0.8rem; color:var(--text-muted); flex-wrap:wrap; gap:8px;">
              <div class="citation-actions-flex">
                <button class="citation-action-btn" onclick="openSourcePage('${citation.document}', '${citation.pages}')">
                  <i data-lucide="eye" style="width:12px;"></i> Open Source Page
                </button>
                <button class="citation-action-btn" onclick="viewHighlightedText('chunk-1')">
                  <i data-lucide="highlighter" style="width:12px;"></i> View Highlighted Text
                </button>
              </div>
              <span>This answer is generated only from the uploaded documents.</span>
            </div>
          </div>

          <!-- Document reference chunks -->
          <div style="margin-bottom:12px; font-weight:700; font-size:1rem;">Retrieved Document Chunks</div>
          <div style="display:flex; flex-direction:column; gap:16px;">
            ${chunkCardsHtml}
          </div>
        `;
      }
    }
  }
  lucide.createIcons();
}

window.submitSemanticSearch = function(event) {
  if (event) event.preventDefault();
  
  const searchInput = getEl('searchBarInput');
  if (!searchInput) return;

  const query = searchInput.value.trim();
  if (query === "") return;

  // Add to recent search
  if (!state.recentSearches.includes(query)) {
    state.recentSearches.unshift(query);
  }

  state.isSearchLoading = true;
  state.activeSearchQuery = query;

  const resultsContainer = getEl('searchResultsBox');
  if (resultsContainer) {
    const loaderSteps = [
      { text: "Searching Documents...", maxPct: 20 },
      { text: "Finding Similar Paragraphs...", maxPct: 40 },
      { text: "Ranking Results...", maxPct: 60 },
      { text: "Generating Answer...", maxPct: 80 },
      { text: "Completed", maxPct: 100 }
    ];

    let currentPct = 0;
    
    const progressTimer = setInterval(() => {
      if (currentPct <= 100) {
        // Find matching step based on percentage ranges
        const step = loaderSteps.find(s => currentPct <= s.maxPct) || loaderSteps[loaderSteps.length - 1];
        
        resultsContainer.innerHTML = `
          <div class="rag-progress-loader animated-fade-in">
            <div class="spinner" style="margin: 0 auto 20px;"></div>
            <div class="rag-progress-label">${step.text}</div>
            <div style="font-size:1.5rem; font-weight:800; color:var(--color-blue); margin-top:4px;">${currentPct}%</div>
            <div class="progress-bar-bg" style="max-width: 320px; width: 100%; margin: 10px auto;">
              <div class="progress-bar-fill" style="width: ${currentPct}%;"></div>
            </div>
          </div>
        `;
        currentPct += 5;
      } else {
        clearInterval(progressTimer);
        
        // Execute lookup logic
        state.isSearchLoading = false;
        const cleanQuery = query.toLowerCase().replace(/[?.,]/g, "").trim();
        let ragMatch = mockRAGData[cleanQuery];

        if (ragMatch) {
          // Perform local criteria filtering (similarity / document selection)
          let filteredChunks = ragMatch.chunks.filter(chunk => {
            const meetsSimilarity = chunk.similarity >= state.searchFilters.minSimilarity;
            
            let meetsDoc = true;
            if (!state.selectedSearchDocs.includes('all')) {
              meetsDoc = state.selectedSearchDocs.some(docId => {
                const matchedDoc = state.documents.find(d => d.id === docId);
                return matchedDoc && chunk.document === matchedDoc.name;
              });
            }
            
            return meetsSimilarity && meetsDoc;
          });

          // Clone match and assign filtered chunks
          state.searchResults = {
            ...ragMatch,
            chunks: filteredChunks
          };
        } else {
          // No match, fall back to "No relevant info found" structure
          state.searchResults = {
            empty: true,
            message: "We couldn't locate information matching the meaning of this question in the active documents index."
          };
        }

        renderSearchPage();
      }
    }, 70);
  }
};

window.clearSemanticSearch = function() {
  const searchInput = getEl('searchBarInput');
  if (searchInput) searchInput.value = "";
  state.searchResults = null;
  state.activeSearchQuery = "";
  renderSearchPage();
};

window.sendSemanticQuery = function(text) {
  const searchInput = getEl('searchBarInput');
  if (searchInput) {
    searchInput.value = text;
    submitSemanticSearch();
  }
};

window.onSearchSimilaritySliderInput = function(val) {
  getEl('searchSimilaritySliderVal').textContent = `${val}%`;
  state.searchFilters.minSimilarity = parseInt(val);
  
  if (state.searchResults && !state.searchResults.empty) {
    const cleanQuery = state.activeSearchQuery.toLowerCase().replace(/[?.,]/g, "").trim();
    const originalMatch = mockRAGData[cleanQuery];
    if (originalMatch) {
      let filtered = originalMatch.chunks.filter(chunk => {
        const meetsSimilarity = chunk.similarity >= state.searchFilters.minSimilarity;
        
        let meetsDoc = true;
        if (!state.selectedSearchDocs.includes('all')) {
          meetsDoc = state.selectedSearchDocs.some(docId => {
            const matchedDoc = state.documents.find(d => d.id === docId);
            return matchedDoc && chunk.document === matchedDoc.name;
          });
        }
        return meetsSimilarity && meetsDoc;
      });
      state.searchResults.chunks = filtered;
    }
  }
  renderSearchPage();
};

window.simulateVoiceSearch = function() {
  showToast("Voice search activated: Listening for query...", "info");
};

// Modal document text preview action trigger
window.openSourcePage = function(docName, page) {
  const modal = getEl('documentPreviewModal');
  const modalTitle = getEl('modalDocTitle');
  const modalBody = getEl('modalDocBody');

  if (modal && modalTitle && modalBody) {
    modalTitle.textContent = `${docName} - Page ${page}`;
    
    // Custom mock content representing the referenced page content
    let rawText = `[PREVIEWING REFERENCED PAGE ELEMENT]\n\n`;
    if (docName.includes("Machine_Learning")) {
      rawText += `Section 4.2: Artificial Neural Networks (ANNs)\n\n`;
      rawText += `Artificial Neural Networks (ANNs) are computational models inspired by the structure and functioning of the human brain. They consist of interconnected nodes (neurons) that learn patterns from data and are widely used in classification, prediction, and deep learning applications.\n\n`;
      rawText += `Backpropagation represents the fundamental training model algorithms. By computing loss margins across hidden layers, gradient weights adjust to optimize classifier accuracy thresholds.`;
    } else if (docName.includes("AI_Notes")) {
      rawText += `Section 5.1: Containerized System Architectures\n\n`;
      rawText += `In Chapter 5, we outline the system deployment schema. Container microservices are coordinated via orchestration tools with health-checks active. Load balancing adjustments dynamically launch node instances to handle vector processing requests during spikes.`;
    } else {
      rawText += `Standard documentation reference parameters:\n\n`;
      rawText += `This page outlines standard core components, including layout bindings, data structures, and configuration keys. Reference text indicates baseline vectors matching operational scopes.`;
    }

    modalBody.innerHTML = `<pre style="font-family:inherit; white-space:pre-wrap; line-height:1.6;">${rawText}</pre>`;
    modal.classList.add('open');
  }
};

window.closeDocPreviewModal = function() {
  const modal = getEl('documentPreviewModal');
  if (modal) modal.classList.remove('open');
};

// View and scroll highlighted chunks triggers
window.viewHighlightedText = function(chunkId) {
  // If search page results are active, find chunk element
  const chunkEl = getEl(chunkId);
  if (chunkEl) {
    chunkEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    chunkEl.classList.remove('highlight-flash-active');
    
    // Trigger double render cycle to restart transition animations
    void chunkEl.offsetWidth; 
    chunkEl.classList.add('highlight-flash-active');
    
    showToast("Highlighted text location focused!", "info");
  } else {
    // Scroll down to matching list on chat page if needed, or display flash mock
    showToast("Scrolling and focusing source paragraph chunk...", "info");
    const container = getEl('chatMessagesContainer');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
};

// --- GLOBAL MODULE CONTROLLERS ---

window.toggleDarkMode = function() {
  state.isDarkMode = !state.isDarkMode;
  if (state.isDarkMode) {
    document.body.classList.add('dark');
    showToast("Dark mode activated", "info");
  } else {
    document.body.classList.remove('dark');
    showToast("Light mode activated", "info");
  }
  localStorage.setItem('docmind-darkmode', state.isDarkMode ? 'true' : 'false');
};

window.setLibraryLayout = function(layout) {
  state.libraryLayout = layout;
  renderLibraryPage();
};

window.onLibrarySearch = function(val) {
  state.libraryFilters.search = val;
  renderLibraryPage();
};

window.onLibraryFilterType = function(val) {
  state.libraryFilters.type = val;
  renderLibraryPage();
};

window.onLibrarySort = function(val) {
  state.libraryFilters.sort = val;
  renderLibraryPage();
};

window.openDocChat = function(docId) {
  let existing = state.conversations.find(c => c.documentId === docId);
  if (existing) {
    state.activeConversationId = existing.id;
  } else {
    const doc = state.documents.find(d => d.id === docId);
    const newThreadId = `chat-${Date.now()}`;
    const newThread = {
      id: newThreadId,
      title: `Analyze: ${doc ? doc.name : "Document Context"}`,
      documentId: docId,
      documentName: doc ? doc.name : "Document Context",
      dateGroup: "Today",
      date: new Date().toISOString().split('T')[0],
      messages: []
    };
    state.conversations.unshift(newThread);
    state.activeConversationId = newThreadId;
  }
  window.location.hash = '#chat';
};

window.deleteDocument = function(docId) {
  const docIndex = state.documents.findIndex(d => d.id === docId);
  if (docIndex === -1) return;

  const docName = state.documents[docIndex].name;
  
  if (confirm(`Are you sure you want to permanently delete "${docName}"?`)) {
    state.documents.splice(docIndex, 1);
    
    state.activities.unshift({
      id: `act-del-${Date.now()}`,
      type: 'security',
      description: `Deleted document "${docName}"`,
      time: 'Just now'
    });

    state.conversations = state.conversations.filter(c => c.documentId !== docId);
    if (state.conversations.length > 0) {
      state.activeConversationId = state.conversations[0].id;
    } else {
      state.activeConversationId = null;
    }

    showToast(`Successfully deleted ${docName}`, 'error');
    
    const hash = window.location.hash;
    if (hash === '#dashboard') renderDashboardOverview();
    if (hash === '#upload') renderUploadPage();
    if (hash === '#library') renderLibraryPage();
    if (hash === '#chat') renderChatPage();
    if (hash === '#search') renderSearchPage();
  }
};

window.renameDocument = function(docId) {
  const doc = state.documents.find(d => d.id === docId);
  if (!doc) return;

  const newName = prompt(`Enter a new name for "${doc.name}":`, doc.name);
  if (newName && newName.trim() !== "" && newName !== doc.name) {
    const oldName = doc.name;
    doc.name = newName.trim();
    
    state.activities.unshift({
      id: `act-ren-${Date.now()}`,
      type: 'settings',
      description: `Renamed file from "${oldName}" to "${doc.name}"`,
      time: 'Just now'
    });

    state.conversations.forEach(c => {
      if (c.documentId === docId) c.documentName = doc.name;
    });

    showToast(`Renamed file to ${doc.name}`, 'success');
    
    const hash = window.location.hash;
    if (hash === '#dashboard') renderDashboardOverview();
    if (hash === '#library') renderLibraryPage();
    if (hash === '#chat') renderChatPage();
    if (hash === '#search') renderSearchPage();
  }
};

window.simulateFileUpload = function(files) {
  if (files.length === 0) return;

  Array.from(files).forEach(file => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(extension)) {
      showToast(`Unsupported file type: .${extension}. Only PDF, DOCX, and TXT are supported.`, 'error');
      return;
    }

    const fileSizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newUploadState = {
      id: uploadId,
      name: file.name,
      extension: extension,
      sizeStr: fileSizeStr,
      progress: 0
    };

    state.uploadingFiles.push(newUploadState);
    renderUploadPage();
    lucide.createIcons();

    const interval = setInterval(() => {
      const up = state.uploadingFiles.find(u => u.id === uploadId);
      if (!up) {
        clearInterval(interval);
        return;
      }

      up.progress += 10;
      if (up.progress >= 100) {
        up.progress = 100;
        clearInterval(interval);
        
        state.uploadingFiles = state.uploadingFiles.filter(u => u.id !== uploadId);
        
        const newDocId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const newDoc = {
          id: newDocId,
          name: up.name,
          type: up.extension,
          size: up.sizeStr,
          pages: Math.floor(Math.random() * 20) + 1,
          uploadDate: new Date().toISOString().split('T')[0],
          status: "Analyzed"
        };
        state.documents.unshift(newDoc);

        const newThreadId = `chat-${Date.now()}`;
        state.conversations.unshift({
          id: newThreadId,
          title: `Analyze: ${up.name}`,
          documentId: newDocId,
          documentName: up.name,
          dateGroup: "Today",
          date: newDoc.uploadDate,
          messages: []
        });
        state.activeConversationId = newThreadId;

        state.activities.unshift({
          id: `act-up-${Date.now()}`,
          type: 'upload',
          description: `Uploaded and analyzed document "${up.name}"`,
          time: 'Just now'
        });

        showToast(`Document "${up.name}" indexed and ready for chat!`, 'success');
        
        const hash = window.location.hash;
        if (hash === '#upload') renderUploadPage();
        if (hash === '#chat') renderChatPage();
      } else {
        renderUploadPage();
      }
      lucide.createIcons();
    }, 150);
  });
};

window.cancelUpload = function(uploadId) {
  const file = state.uploadingFiles.find(u => u.id === uploadId);
  if (file) {
    state.uploadingFiles = state.uploadingFiles.filter(u => u.id !== uploadId);
    showToast(`Cancelled upload of ${file.name}`, 'warning');
    renderUploadPage();
  }
};

window.saveProfileSettings = function(event) {
  if (event) event.preventDefault();
  const name = getEl('profileNameInput').value.trim();
  const email = getEl('profileEmailInput').value.trim();
  
  if (name === "" || email === "") {
    showToast("Name and email cannot be empty", "error");
    return;
  }

  state.currentUser.name = name;
  state.currentUser.email = email;
  state.currentUser.avatar = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  
  updateUserUI();
  showToast("Profile settings saved successfully", "success");
};

window.deleteAccount = function() {
  if (confirm("WARNING: This will permanently delete your account and all uploaded documents. This action cannot be undone. Do you wish to proceed?")) {
    state.currentUser = null;
    state.documents = [];
    state.conversations = [];
    state.activeConversationId = null;
    state.activities = [];
    
    showToast("Account deleted. Logging out...", "error");
    
    setTimeout(() => {
      window.location.hash = '#landing';
    }, 1500);
  }
};

window.handleLoginSubmit = function(event) {
  if (event) event.preventDefault();
  state.currentUser = {
    name: "Immanuel Dev",
    email: getEl('loginEmailInput').value || "immanuel@docmind.ai",
    avatar: "ID"
  };
  
  updateUserUI();
  showToast("Welcome back to DocMind AI!", "success");
  window.location.hash = '#dashboard';
};

window.handleSignupSubmit = function(event) {
  if (event) event.preventDefault();
  state.currentUser = {
    name: getEl('signupNameInput').value || "New User",
    email: getEl('signupEmailInput').value || "user@example.com",
    avatar: (getEl('signupNameInput').value || "NU").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
  };

  updateUserUI();
  showToast("Welcome to DocMind AI! Account created successfully.", "success");
  window.location.hash = '#dashboard';
};

window.handleForgotSubmit = function(event) {
  if (event) event.preventDefault();
  showToast("Password reset link sent to your email", "info");
  window.location.hash = '#login';
};

window.handleHeaderSearch = function(event) {
  const query = event.target.value;
  if (window.location.hash === '#library') {
    getEl('librarySearchInput').value = query;
    window.onLibrarySearch(query);
  } else {
    state.libraryFilters.search = query;
    window.location.hash = '#library';
  }
};

window.triggerFileInputClick = function() {
  getEl('hiddenFileInput').click();
};

window.simulateMicrophone = function() {
  showToast("Voice typing UI simulation active: Try speaking your query...", "info");
};

window.simulateAttachment = function() {
  showToast("Attachment support is limited to uploaded PDF, DOCX, and TXT workspace assets.", "warning");
};

window.toggleSidebar = function() {
  getEl('appSidebar').classList.toggle('mobile-open');
};

window.handleOauthLogin = function(provider) {
  const modal = getEl('oauthModal');
  const title = getEl('oauthModalTitle');
  const desc = getEl('oauthModalDesc');
  
  if (!modal) return;
  
  title.textContent = `Connecting to ${provider}...`;
  desc.textContent = `Please authorize DocMind AI to access your ${provider} account info.`;
  modal.classList.add('open');
  
  // Simulate successful authentication after 1.5s
  setTimeout(() => {
    modal.classList.remove('open');
    
    // Choose appropriate mock profile
    if (provider === 'Google') {
      state.currentUser = {
        name: "Google Explorer",
        email: "explorer@gmail.com",
        avatar: "G"
      };
    } else {
      state.currentUser = {
        name: "Github Coder",
        email: "coder@github.com",
        avatar: "GH"
      };
    }
    
    updateUserUI();
    showToast(`Successfully authenticated via ${provider}!`, "success");
    window.location.hash = '#dashboard';
  }, 1500);
};

window.closeOauthModal = function() {
  const modal = getEl('oauthModal');
  if (modal) modal.classList.remove('open');
};

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  const localDark = localStorage.getItem('docmind-darkmode');
  if (localDark === 'true') {
    state.isDarkMode = true;
    document.body.classList.add('dark');
  }

  // Bind close event when clicking outside dropdown pickers
  document.addEventListener('click', (e) => {
    const listS = getEl('searchMultiDocSelectList');
    const listC = getEl('chatMultiDocSelectList');
    const btnS = getEl('searchMultiDocBtn');
    const btnC = getEl('chatMultiDocBtn');

    if (listS && !listS.contains(e.target) && btnS && !btnS.contains(e.target)) {
      listS.classList.remove('open');
    }
    if (listC && !listC.contains(e.target) && btnC && !btnC.contains(e.target)) {
      listC.classList.remove('open');
    }
  });

  const textInput = getEl('chatInput');
  if (textInput) {
    textInput.addEventListener('input', validateChatSendButton);
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitChatMessage();
      }
    });
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
});
