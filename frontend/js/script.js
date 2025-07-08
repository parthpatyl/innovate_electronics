// CMS Application JavaScript
class CMS {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentContentType = null;
        this.editingItem = null;
        // Use the main product API instead of CMS API
        this.apiBaseUrl = getApiUrl('api');
        
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

            // Fetch event registrations if section is events
            if (section === 'events') {
                const registrations = await this.fetchEventRegistrations();
                console.log('Event Registrations:', registrations);
                // (Instructed: just log for now, UI to be added later)
            }
        } catch (error) {
            console.error(`Error loading ${section}:`, error);
            listElement.innerHTML = '<div class="error">Failed to load content</div>';
        }
    }

    async fetchEventRegistrations() {
        try {
            const res = await fetch(getApiUrl('api/events/registrations'));
            const data = await res.json();
            if (data.success) {
                return data.data;
            } else {
                return [];
            }
        } catch (err) {
            console.error('Error fetching event registrations:', err);
            return [];
        }
    }

    async fetchStats() {
        try {
            // Get products count
            const productsEndpoint = getApiUrl('api/products');
            const productsResponse = await fetch(productsEndpoint);
            if (!productsResponse.ok) throw new Error(`HTTP error: ${productsResponse.status}`);
            const productsData = await productsResponse.json();
            const productsCount = productsData.success ? productsData.total || productsData.data.length : 0;

            // Get categories count
            const categoriesEndpoint = getApiUrl('api/categories');
            const categoriesResponse = await fetch(categoriesEndpoint);
            if (!categoriesResponse.ok) throw new Error(`HTTP error: ${categoriesResponse.status}`);
            const categoriesData = await categoriesResponse.json();
            const categoriesCount = categoriesData.success ? Object.keys(categoriesData.data).length : 0;

            // Get events count
            const eventsEndpoint = getApiUrl('api/events');
            const eventsResponse = await fetch(eventsEndpoint);
            if (!eventsResponse.ok) throw new Error(`HTTP error: ${eventsResponse.status}`);
            const eventsData = await eventsResponse.json();
            const eventsCount = eventsData.success ? eventsData.data.length : 0;

            // Get blogs count
            const blogsEndpoint = getApiUrl('api/blogs');
            const blogsResponse = await fetch(blogsEndpoint);
            if (!blogsResponse.ok) throw new Error(`HTTP error: ${blogsResponse.status}`);
            const blogsData = await blogsResponse.json();
            const blogsCount = blogsData.success ? blogsData.data.length : 0;

            return {
                products: productsCount,
                categories: categoriesCount,
                events: eventsCount,
                blogs: blogsCount,
                newsletters: 0 // Placeholder for future implementation
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return {
                products: 0,
                categories: 0,
                events: 0,
                blogs: 0,
                newsletters: 0
            };
        }
    }

    async fetchRecentContent() {
        try {
            // Get recent products - using the same pattern as subcategory.html
            const endpoint = getApiUrl('api/products?limit=5');
            console.log('Fetching recent products:', endpoint);
            
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                return data.data.map(product => ({
                    type: 'product',
                    title: product.name,
                    category: product.category,
                    createdAt: product.createdAt,
                    status: 'published'
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching recent content:', error);
            return [];
        }
    }

    async fetchContent(contentType, filters = {}) {
        try {
            if (contentType === 'product') {
                const queryParams = new URLSearchParams();
                if (filters.status) queryParams.append('status', filters.status);
                if (filters.search) queryParams.append('search', filters.search);

                const endpoint = getApiUrl(`api/products?${queryParams}`);
                console.log('Fetching products:', endpoint);
                
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const data = await response.json();
                return data.success ? data.data : [];
            }
            if (contentType === 'event') {
                const endpoint = getApiUrl('api/events');
                console.log('Fetching events:', endpoint);
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const data = await response.json();
                return data.success ? data.data : [];
            }
            if (contentType === 'blog') {
                const endpoint = getApiUrl('api/blogs');
                console.log('Fetching blogs:', endpoint);
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const data = await response.json();
                return data.success ? data.data : [];
            }
            // For other content types, return empty array for now
            return [];
        } catch (error) {
            console.error(`Error fetching ${contentType}:`, error);
            return [];
        }
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

        if (section === 'products') {
            // Render products with product-specific fields
            container.innerHTML = content.map(product => `
                <div class="content-item">
                    <div class="content-info">
                        <div class="content-title">${product.name || 'Unnamed Product'}</div>
                        <div class="content-meta">
                            <span><i class="fas fa-tag"></i> ${product.category || 'No Category'}</span>
                            <span><i class="fas fa-clock"></i> ${product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'No Date'}</span>
                            ${product.subcategory ? `<span><i class="fas fa-layer-group"></i> ${product.subcategory}</span>` : ''}
                            <span class="content-status status-published">Published</span>
                        </div>
                        ${product.overview && product.overview.description ? `
                            <div class="content-description">
                                ${product.overview.description[0] ? product.overview.description[0].substring(0, 100) + '...' : 'No description available'}
                            </div>
                        ` : ''}
                    </div>
                    <div class="content-actions-btns">
                        <button class="btn btn-sm btn-secondary" onclick="cms.viewProduct('${product.name}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="cms.editProduct('${product.name}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="cms.deleteProduct('${product._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } else if (section === 'events') {
            // Render events with a View Info button
            container.innerHTML = content.map(event => `
                <div class="content-item">
                    <div class="content-info">
                        <div class="content-title">${event.title || 'Untitled Event'}</div>
                        <div class="content-meta">
                            <span>${event.date ? new Date(event.date).toLocaleDateString() : 'No Date'}</span>
                            <span>${event.location || 'No Location'}</span>
                            <span class="content-status status-${event.status || 'published'}">${event.status || 'published'}</span>
                        </div>
                    </div>
                    <div class="content-actions-btns">
                        <button class="btn btn-sm btn-info" onclick="cms.viewEventInfo('${event.title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-info-circle"></i> View Info
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="cms.editContent('${event._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="cms.deleteContent('${event._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            // Default rendering for other content types
            container.innerHTML = content.map(item => `
                <div class="content-item">
                    <div class="content-info">
                        <div class="content-title">${item.title || item.name || 'Untitled'}</div>
                        <div class="content-meta">
                            <span>${item.author || 'Unknown'}</span>
                            <span>${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'No Date'}</span>
                            <span class="content-status status-${item.status || 'published'}">${item.status || 'published'}</span>
                        </div>
                    </div>
                    <div class="content-actions-btns">
                        <button class="btn btn-sm btn-secondary" onclick="cms.editContent('${item.slug || item._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="cms.deleteContent('${item.slug || item._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    showCreateModal() {
        this.editingItem = null;
        
        if (this.currentContentType === 'product') {
            document.getElementById('modal-title').textContent = 'Create New Product';
            this.generateProductForm();
        } else {
            document.getElementById('modal-title').textContent = `Create New ${this.currentContentType.charAt(0).toUpperCase() + this.currentContentType.slice(1)}`;
            this.generateForm();
        }
        
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

    // Product-specific methods
    async viewProduct(productName) {
        try {
            const endpoint = getApiUrl(`api/products/${encodeURIComponent(productName)}`);
            console.log('Fetching product for viewing:', endpoint);
            
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            
            if (data.success) {
                // Use the same navigation pattern as subcategory.html
                const category = data.data.category || 'Products';
                window.open(`productpagemain.html?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(productName)}`, '_blank');
            } else {
                this.showError('Failed to load product details');
            }
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Failed to load product details');
        }
    }

    async editProduct(productName) {
        try {
            const endpoint = getApiUrl(`api/products/${encodeURIComponent(productName)}`);
            console.log('Fetching product for editing:', endpoint);
            
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            
            if (data.success) {
                this.editingItem = data.data;
                document.getElementById('modal-title').textContent = 'Edit Product';
                this.generateProductForm();
                this.populateProductForm(data.data);
                this.showModal();
            } else {
                this.showError('Failed to load product for editing');
            }
        } catch (error) {
            console.error('Error loading product for edit:', error);
            this.showError('Failed to load product for editing');
        }
    }

    async deleteProduct(productId) {
        this.deletingItemId = productId;
        this.deletingItemType = 'product';
        this.showDeleteModal();
    }

    generateProductForm() {
        const form = document.getElementById('content-form');
        
        form.innerHTML = `
            <div class="form-group">
                <label class="form-label" for="name">Product Name *</label>
                <input type="text" class="form-input" id="name" name="name" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="category">Category *</label>
                <input type="text" class="form-input" id="category" name="category" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="subcategory">Subcategory</label>
                <input type="text" class="form-input" id="subcategory" name="subcategory">
            </div>
            <div class="form-group">
                <label class="form-label" for="image">Image URL</label>
                <input type="text" class="form-input" id="image" name="image">
            </div>
            <div class="form-group">
                <label class="form-label" for="description">Description</label>
                <textarea class="form-input form-textarea" id="description" name="description" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label" for="features">Features (one per line)</label>
                <textarea class="form-input form-textarea" id="features" name="features" rows="4" placeholder="Enter features, one per line"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label" for="applications">Applications (one per line)</label>
                <textarea class="form-input form-textarea" id="applications" name="applications" rows="4" placeholder="Enter applications, one per line"></textarea>
            </div>
        `;
    }

    populateProductForm(product) {
        document.getElementById('name').value = product.name || '';
        document.getElementById('category').value = product.category || '';
        document.getElementById('subcategory').value = product.subcategory || '';
        document.getElementById('image').value = product.image || '';
        
        // Handle description
        if (product.overview && product.overview.description) {
            document.getElementById('description').value = product.overview.description.join('\n');
        }
        
        // Handle features
        if (product.overview && product.overview.features) {
            document.getElementById('features').value = product.overview.features.join('\n');
        }
        
        // Handle applications
        if (product.overview && product.overview.applications) {
            document.getElementById('applications').value = product.overview.applications.join('\n');
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
            
            // Check if we're editing a product
            if (this.editingItem && this.editingItem._id) {
                // This is a product edit
                const productData = this.prepareProductData(data);
                
                // Use product name for the API endpoint
                const productName = this.editingItem.name;
                const endpoint = getApiUrl(`api/products/${encodeURIComponent(productName)}`);
                console.log('Updating product:', endpoint);
                
                response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            } else if (this.currentContentType === 'product') {
                // This is a new product creation
                const productData = this.prepareProductData(data);
                const endpoint = getApiUrl('api/products');
                console.log('Creating new product:', endpoint);
                
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            } else {
                // Handle other content types (legacy CMS)
                if (this.editingItem) {
                    response = await fetch(`${this.apiBaseUrl}/content/${this.editingItem.slug}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } else {
                    response = await fetch(`${this.apiBaseUrl}/content`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                }
            }

            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
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

    prepareProductData(formData) {
        const productData = {
            name: formData.name,
            category: formData.category,
            image: formData.image
        };

        // Handle subcategory
        if (formData.subcategory) {
            productData.subcategory = formData.subcategory;
        }

        // Handle overview data
        productData.overview = {
            description: formData.description ? formData.description.split('\n').filter(line => line.trim()) : [],
            features: formData.features ? formData.features.split('\n').filter(line => line.trim()) : [],
            applications: formData.applications ? formData.applications.split('\n').filter(line => line.trim()) : []
        };

        return productData;
    }

    async deleteContent(slug) {
        this.itemToDelete = slug;
        this.showDeleteModal();
    }

    async confirmDelete() {
        try {
            let response;
            
            // Check if we're deleting a product
            if (this.deletingItemType === 'product' && this.deletingItemId) {
                const endpoint = getApiUrl(`api/products/${this.deletingItemId}`);
                console.log('Deleting product:', endpoint);
                
                response = await fetch(endpoint, {
                    method: 'DELETE'
                });
            } else {
                // Handle other content types (legacy CMS)
                response = await fetch(`${this.apiBaseUrl}/content/${this.itemToDelete}`, {
                    method: 'DELETE'
                });
            }

            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
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

    // Add this method to the CMS class
    async viewEventInfo(eventTitle) {
        // Redirect to the event registrations page with the event_title as a query parameter
        window.location.href = `event-registrations.html?event_title=${encodeURIComponent(eventTitle)}`;
    }
}

// Initialize CMS when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cms = new CMS();
}); 