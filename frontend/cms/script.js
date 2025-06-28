// CMS Application JavaScript
class CMS {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentContentType = null;
        this.editingItem = null;
        this.apiBaseUrl = '/api/cms-simple';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDashboard();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(e.target.closest('.nav-link').dataset.section);
            });
        });

        // Create button
        document.getElementById('create-btn').addEventListener('click', () => {
            this.showCreateModal();
        });

        // Modal events
        document.getElementById('modal-close').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modal-save').addEventListener('click', () => {
            this.saveContent();
        });

        // Delete modal events
        document.getElementById('delete-modal-close').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('delete-cancel').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('delete-confirm').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Search and filter events
        this.bindSearchAndFilterEvents();
    }

    bindSearchAndFilterEvents() {
        const searchInputs = ['products-search', 'events-search', 'blogs-search', 'newsletters-search'];
        const filterSelects = ['products-status-filter', 'events-status-filter', 'blogs-status-filter', 'newsletters-status-filter'];

        searchInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.handleSearch(e.target.value, id.replace('-search', ''));
                });
            }
        });

        filterSelects.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.handleFilter(e.target.value, id.replace('-status-filter', ''));
                });
            }
        });
    }

    navigateToSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(sectionEl => {
            sectionEl.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        // Update header
        this.updateHeader(section);

        // Load content
        this.currentSection = section;
        this.loadSectionContent(section);
    }

    updateHeader(section) {
        const titles = {
            dashboard: 'Dashboard',
            products: 'Products',
            events: 'Events',
            blogs: 'Blogs',
            newsletters: 'Newsletters'
        };

        const descriptions = {
            dashboard: 'Welcome to your content management system',
            products: 'Manage your product catalog',
            events: 'Organize and schedule events',
            blogs: 'Create and edit blog posts',
            newsletters: 'Design newsletter issues'
        };

        document.getElementById('page-title').textContent = titles[section];
        document.getElementById('page-description').textContent = descriptions[section];

        // Show/hide create button
        const createBtn = document.getElementById('create-btn');
        if (section === 'dashboard') {
            createBtn.style.display = 'none';
        } else {
            createBtn.style.display = 'flex';
            this.currentContentType = section.slice(0, -1); // Remove 's' from end
        }
    }

    async loadDashboard() {
        try {
            // Load statistics
            const stats = await this.fetchStats();
            this.updateDashboardStats(stats);

            // Load recent content
            const recentContent = await this.fetchRecentContent();
            this.updateRecentContent(recentContent);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async loadSectionContent(section) {
        if (section === 'dashboard') {
            this.loadDashboard();
            return;
        }

        const contentType = section.slice(0, -1); // Remove 's' from end
        const listElement = document.getElementById(`${section}-list`);
        
        try {
            listElement.innerHTML = '<div class="loading">Loading...</div>';
            
            const content = await this.fetchContent(contentType);
            this.renderContentList(content, section);
        } catch (error) {
            console.error(`Error loading ${section}:`, error);
            listElement.innerHTML = '<div class="error">Failed to load content</div>';
        }
    }

    async fetchStats() {
        const response = await fetch(`${this.apiBaseUrl}/stats`);
        const data = await response.json();
        return data.success ? data.data : {};
    }

    async fetchRecentContent() {
        const response = await fetch(`${this.apiBaseUrl}/content?limit=5`);
        const data = await response.json();
        return data.success ? data.data : [];
    }

    async fetchContent(contentType, filters = {}) {
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.search) queryParams.append('search', filters.search);

        const response = await fetch(`${this.apiBaseUrl}/content?${queryParams}`);
        const data = await response.json();
        return data.success ? data.data : [];
    }

    updateDashboardStats(stats) {
        document.getElementById('products-count').textContent = stats.products || 0;
        document.getElementById('events-count').textContent = stats.events || 0;
        document.getElementById('blogs-count').textContent = stats.blogs || 0;
        document.getElementById('newsletters-count').textContent = stats.newsletters || 0;
    }

    updateRecentContent(content) {
        const container = document.getElementById('recent-content-list');
        
        if (!content || content.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-seedling"></i>
                    <p>No content yet. Start by creating your first piece of content!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = content.map(item => `
            <div class="content-item">
                <div class="content-info">
                    <div class="content-title">${item.title}</div>
                    <div class="content-meta">
                        <span>${item.author}</span>
                        <span>${new Date(item.createdAt).toLocaleDateString()}</span>
                        <span class="content-status status-${item.status}">${item.status}</span>
                    </div>
                </div>
                <div class="content-actions-btns">
                    <button class="btn btn-sm btn-secondary" onclick="cms.editContent('${item.slug}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cms.deleteContent('${item.slug}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderContentList(content, section) {
        const container = document.getElementById(`${section}-list`);
        
        if (!content || content.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No ${section} found. Create your first ${section.slice(0, -1)}!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = content.map(item => `
            <div class="content-item">
                <div class="content-info">
                    <div class="content-title">${item.title}</div>
                    <div class="content-meta">
                        <span>${item.author}</span>
                        <span>${new Date(item.createdAt).toLocaleDateString()}</span>
                        <span class="content-status status-${item.status}">${item.status}</span>
                    </div>
                </div>
                <div class="content-actions-btns">
                    <button class="btn btn-sm btn-secondary" onclick="cms.editContent('${item.slug}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cms.deleteContent('${item.slug}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    showCreateModal() {
        this.editingItem = null;
        document.getElementById('modal-title').textContent = `Create New ${this.currentContentType.charAt(0).toUpperCase() + this.currentContentType.slice(1)}`;
        this.generateForm();
        this.showModal();
    }

    async editContent(slug) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/content/${slug}`);
            const data = await response.json();
            
            if (data.success) {
                this.editingItem = data.data;
                document.getElementById('modal-title').textContent = `Edit ${this.currentContentType.charAt(0).toUpperCase() + this.currentContentType.slice(1)}`;
                this.generateForm();
                this.populateForm(data.data);
                this.showModal();
            } else {
                this.showError('Failed to load content for editing');
            }
        } catch (error) {
            console.error('Error loading content for edit:', error);
            this.showError('Failed to load content for editing');
        }
    }

    generateForm() {
        const form = document.getElementById('content-form');
        const contentType = this.currentContentType;

        // Define form fields for each content type
        const formFields = {
            products: [
                { name: 'title', label: 'Product Name', type: 'text', required: true },
                { name: 'slug', label: 'URL Slug', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea', required: true },
                { name: 'price', label: 'Price', type: 'number', required: true },
                { name: 'image', label: 'Image URL', type: 'text', required: false },
                { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived'], required: true }
            ],
            events: [
                { name: 'title', label: 'Event Title', type: 'text', required: true },
                { name: 'slug', label: 'URL Slug', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea', required: true },
                { name: 'location', label: 'Location', type: 'text', required: true },
                { name: 'start_date', label: 'Start Date', type: 'datetime-local', required: true },
                { name: 'end_date', label: 'End Date', type: 'datetime-local', required: true },
                { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived'], required: true }
            ],
            blogs: [
                { name: 'title', label: 'Blog Title', type: 'text', required: true },
                { name: 'slug', label: 'URL Slug', type: 'text', required: true },
                { name: 'body', label: 'Content (Markdown)', type: 'markdown', required: true },
                { name: 'author', label: 'Author', type: 'text', required: true },
                { name: 'published_at', label: 'Publish Date', type: 'datetime-local', required: false },
                { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived'], required: true }
            ],
            newsletters: [
                { name: 'title', label: 'Newsletter Title', type: 'text', required: true },
                { name: 'slug', label: 'URL Slug', type: 'text', required: true },
                { name: 'content', label: 'Content (Markdown)', type: 'markdown', required: true },
                { name: 'issue_date', label: 'Issue Date', type: 'date', required: true },
                { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived'], required: true }
            ]
        };

        const fields = formFields[contentType] || [];
        
        form.innerHTML = fields.map(field => {
            if (field.type === 'markdown') {
                return `
                    <div class="form-group">
                        <label class="form-label" for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
                        <div class="markdown-editor">
                            <div class="markdown-toolbar">
                                <button type="button" class="markdown-btn" data-action="bold">Bold</button>
                                <button type="button" class="markdown-btn" data-action="italic">Italic</button>
                                <button type="button" class="markdown-btn" data-action="link">Link</button>
                                <button type="button" class="markdown-btn" data-action="list">List</button>
                                <button type="button" class="markdown-btn" data-action="preview">Preview</button>
                            </div>
                            <textarea class="form-input form-textarea" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}></textarea>
                            <div class="markdown-preview" style="display: none;"></div>
                        </div>
                    </div>
                `;
            } else if (field.type === 'select') {
                return `
                    <div class="form-group">
                        <label class="form-label" for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
                        <select class="form-input form-select" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>
                            ${field.options.map(option => `<option value="${option}">${option.charAt(0).toUpperCase() + option.slice(1)}</option>`).join('')}
                        </select>
                    </div>
                `;
            } else if (field.type === 'textarea') {
                return `
                    <div class="form-group">
                        <label class="form-label" for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
                        <textarea class="form-input form-textarea" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}></textarea>
                    </div>
                `;
            } else {
                return `
                    <div class="form-group">
                        <label class="form-label" for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
                        <input type="${field.type}" class="form-input" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>
                    </div>
                `;
            }
        }).join('');

        // Bind markdown editor events
        this.bindMarkdownEvents();
    }

    bindMarkdownEvents() {
        // Markdown toolbar buttons
        document.querySelectorAll('.markdown-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                const textarea = btn.closest('.markdown-editor').querySelector('textarea');
                const preview = btn.closest('.markdown-editor').querySelector('.markdown-preview');
                
                if (action === 'preview') {
                    this.toggleMarkdownPreview(textarea, preview);
                } else {
                    this.insertMarkdown(textarea, action);
                }
            });
        });
    }

    toggleMarkdownPreview(textarea, preview) {
        if (preview.style.display === 'none') {
            preview.innerHTML = this.renderMarkdown(textarea.value);
            preview.style.display = 'block';
            textarea.style.display = 'none';
        } else {
            preview.style.display = 'none';
            textarea.style.display = 'block';
        }
    }

    insertMarkdown(textarea, action) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        let replacement = '';

        switch (action) {
            case 'bold':
                replacement = `**${text.substring(start, end)}**`;
                break;
            case 'italic':
                replacement = `*${text.substring(start, end)}*`;
                break;
            case 'link':
                replacement = `[${text.substring(start, end)}](url)`;
                break;
            case 'list':
                replacement = `- ${text.substring(start, end)}`;
                break;
        }

        textarea.value = text.substring(0, start) + replacement + text.substring(end);
        textarea.focus();
        textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }

    renderMarkdown(text) {
        // Simple markdown rendering (you can enhance this with a proper markdown library)
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            .replace(/^- (.*)/gm, '<li>$1</li>')
            .replace(/\n/g, '<br>');
    }

    populateForm(data) {
        Object.keys(data).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = data[key];
                } else {
                    field.value = data[key];
                }
            }
        });
    }

    async saveContent() {
        const form = document.getElementById('content-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            let response;
            if (this.editingItem) {
                // Update existing content
                response = await fetch(`${this.apiBaseUrl}/content/${this.editingItem.slug}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                // Create new content
                response = await fetch(`${this.apiBaseUrl}/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            const result = await response.json();
            
            if (result.success) {
                this.hideModal();
                this.showSuccess(this.editingItem ? 'Content updated successfully!' : 'Content created successfully!');
                this.loadSectionContent(this.currentSection);
                if (this.currentSection === 'dashboard') {
                    this.loadDashboard();
                }
            } else {
                this.showError(result.message || 'Failed to save content');
            }
        } catch (error) {
            console.error('Error saving content:', error);
            this.showError('Failed to save content');
        }
    }

    async deleteContent(slug) {
        this.itemToDelete = slug;
        this.showDeleteModal();
    }

    async confirmDelete() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/content/${this.itemToDelete}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                this.hideDeleteModal();
                this.showSuccess('Content deleted successfully!');
                this.loadSectionContent(this.currentSection);
                if (this.currentSection === 'dashboard') {
                    this.loadDashboard();
                }
            } else {
                this.showError(result.message || 'Failed to delete content');
            }
        } catch (error) {
            console.error('Error deleting content:', error);
            this.showError('Failed to delete content');
        }
    }

    handleSearch(query, section) {
        // Implement search functionality
        console.log(`Searching ${section} for: ${query}`);
        // You can implement debounced search here
    }

    handleFilter(status, section) {
        // Implement filter functionality
        console.log(`Filtering ${section} by status: ${status}`);
        // You can implement status filtering here
    }

    showModal() {
        document.getElementById('modal-overlay').classList.add('active');
    }

    hideModal() {
        document.getElementById('modal-overlay').classList.remove('active');
        document.getElementById('content-form').reset();
    }

    showDeleteModal() {
        document.getElementById('delete-modal').classList.add('active');
    }

    hideDeleteModal() {
        document.getElementById('delete-modal').classList.remove('active');
        this.itemToDelete = null;
    }

    showSuccess(message) {
        // Simple success notification
        alert(message); // You can replace this with a proper notification system
    }

    showError(message) {
        // Simple error notification
        alert('Error: ' + message); // You can replace this with a proper notification system
    }
}

// Initialize CMS when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cms = new CMS();
}); 