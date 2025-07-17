// API Service abstraction
class ApiService {
    static async request(endpoint, options = {}) {
        const url = getApiUrl(endpoint);
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }
    
    static async get(endpoint) {
        return this.request(endpoint);
    }
    
    static async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    static async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    static async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// CMS Application JavaScript
class CMS {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentContentType = null;
        this.editingItem = null;
        this.apiBaseUrl = getApiUrl('api');
        this._formBound = false; // Add guard property
        
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

        // Ensure Save button triggers form submit
        document.getElementById('modal-save').addEventListener('click', () => {
            document.getElementById('content-form').requestSubmit();
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

        // Fix Bug 8: Add debounce for search input
        const debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };

        searchInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', debounce((e) => {
                    this.handleSearch(e.target.value, id.replace('-search', ''));
                }, 300)); // 300ms debounce
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
        
        // Fix Bug 6: Check if element exists before adding class
        const navElement = document.querySelector(`[data-section="${section}"]`);
        if (navElement) {
            navElement.classList.add('active');
        } else {
            console.error(`Navigation element for section "${section}" not found`);
            return;
        }

        // Update content sections
        document.querySelectorAll('.content-section').forEach(sectionEl => {
            sectionEl.classList.remove('active');
        });
        
        const contentElement = document.getElementById(section);
        if (contentElement) {
            contentElement.classList.add('active');
        } else {
            console.error(`Content element for section "${section}" not found`);
            return;
        }

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
            console.log('updateHeader - section:', section, 'currentContentType:', this.currentContentType);
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
            // Fix Bug 2: Standardize data length checking
            const productsCount = productsData.success ? 
                (productsData.total || (Array.isArray(productsData.data) ? productsData.data.length : 0)) : 0;

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
            const eventsCount = eventsData.success ? 
                (Array.isArray(eventsData.data) ? eventsData.data.length : 0) : 0;

            // Get blogs count
            const blogsEndpoint = getApiUrl('api/blogs');
            const blogsResponse = await fetch(blogsEndpoint);
            if (!blogsResponse.ok) throw new Error(`HTTP error: ${blogsResponse.status}`);
            const blogsData = await blogsResponse.json();
            const blogsCount = blogsData.success ? 
                (Array.isArray(blogsData.data) ? blogsData.data.filter(item => item.type === 'blog').length : 0) : 0;
            const newslettersCount = blogsData.success ? 
                (Array.isArray(blogsData.data) ? blogsData.data.filter(item => item.type === 'newsletter').length : 0) : 0;

            return {
                products: productsCount,
                categories: categoriesCount,
                events: eventsCount,
                blogs: blogsCount,
                newsletters: newslettersCount
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
            if (contentType === 'newsletter') {
                // Newsletters are stored in the same Content model with type 'newsletter'
                const endpoint = getApiUrl('api/blogs');
                console.log('Fetching newsletters:', endpoint);
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const data = await response.json();
                // Filter to only show newsletters
                return data.success ? data.data.filter(item => item.type === 'newsletter') : [];
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
                        <span>${item.author || 'Unknown'}</span>
                        <span>${item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'No Date'}</span>
                        <span class="content-status status-${item.status || 'published'}">${item.status || 'published'}</span>
                    </div>
                </div>
                <div class="content-actions-btns">
                    <button class="btn btn-sm btn-secondary" onclick="cms.editContent('${item.slug || item._id || ''}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cms.deleteContent('${item.slug || item._id || ''}')">
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
                            <span><i class="fas fa-clock"></i> ${this.formatDate(product.createdAt)}</span>
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
                        <button class="btn btn-sm btn-danger" onclick="cms.deleteProduct('${product.name}')">
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
                            <span>${this.formatDate(event.date)}</span>
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
        } else if (section === 'blogs') {
            // Render blogs
            container.innerHTML = content.map(blog => `
                <div class="content-item">
                    <div class="content-info">
                        <div class="content-title">${blog.title || 'Untitled Blog'}</div>
                        <div class="content-meta">
                            <span>${blog.author || 'Unknown'}</span>
                            <span>${this.formatDate(blog.createdAt)}</span>
                            <span class="content-status status-${blog.status || 'published'}">${blog.status || 'published'}</span>
                        </div>
                        ${blog.excerpt ? `
                            <div class="content-description">
                                ${blog.excerpt.substring(0, 100)}...
                            </div>
                        ` : ''}
                    </div>
                    <div class="content-actions-btns">
                        <button class="btn btn-sm btn-secondary" onclick="cms.editContent('${blog._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="cms.deleteContent('${blog._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } else if (section === 'newsletters') {
            // Render newsletters
            container.innerHTML = content.map(newsletter => `
                <div class="content-item">
                    <div class="content-info">
                        <div class="content-title">${newsletter.title || 'Untitled Newsletter'}</div>
                        <div class="content-meta">
                            <span>${newsletter.author || 'Unknown'}</span>
                            <span>${this.formatDate(newsletter.createdAt)}</span>
                            <span class="content-status status-${newsletter.status || 'published'}">${newsletter.status || 'published'}</span>
                        </div>
                        ${newsletter.excerpt ? `
                            <div class="content-description">
                                ${newsletter.excerpt.substring(0, 100)}...
                            </div>
                        ` : ''}
                    </div>
                    <div class="content-actions-btns">
                        <button class="btn btn-sm btn-secondary" onclick="cms.editContent('${newsletter._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="cms.deleteContent('${newsletter._id}')">
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
                            <span>${this.formatDate(item.createdAt)}</span>
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
        
        console.log('showCreateModal - currentContentType:', this.currentContentType);
        
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
            let response;
            
            // Use different API endpoints based on content type
            if (this.currentContentType === 'event') {
                response = await fetch(`${getApiUrl('api/events')}/${slug}`);
            } else if (this.currentContentType === 'blog' || this.currentContentType === 'newsletter') {
                response = await fetch(`${getApiUrl('api/blogs')}/${slug}`);
            } else {
                // Legacy CMS endpoint for other content types
                response = await fetch(`${this.apiBaseUrl}/content/${slug}`);
            }
            
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            
            if (data.success) {
                this.editingItem = data.data;
                document.getElementById('modal-title').textContent = `Edit ${this.currentContentType.charAt(0).toUpperCase() + this.currentContentType.slice(1)}`;
                this.generateForm();
                this.populateForm(data.data);
                this.showModal();
            } else {
                console.error('Failed to load content for editing:', data.message);
            }
        } catch (error) {
            console.error('Error loading content for edit:', error);
        }
    }

    // Product-specific methods
    async viewProduct(productName) {
        try {
            // Fix Bug 3: Use product ID if available, fallback to name
            const productId = this.getProductId(productName);
            const endpoint = getApiUrl(`api/products/${encodeURIComponent(productId || productName)}`);
            console.log('Fetching product for viewing:', endpoint);
            
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            
            if (data.success) {
                // Use the same navigation pattern as subcategory.html
                const category = data.data.category || 'Products';
                window.open(`productpagemain.html?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(productName)}`, '_blank');
            } else {
                console.error('Failed to load product details:', data.message);
            }
        } catch (error) {
            console.error('Error loading product:', error);
        }
    }

    async editProduct(productName) {
        try {
            // Fix Bug 3: Use product ID if available, fallback to name
            const productId = this.getProductId(productName);
            const endpoint = getApiUrl(`api/products/${encodeURIComponent(productId || productName)}`);
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
                console.error('Failed to load product for editing:', data.message);
            }
        } catch (error) {
            console.error('Error loading product for edit:', error);
        }
    }

    async deleteProduct(productId) {
        this.deletingItemId = productId;
        this.deletingItemType = 'product';
        this.showDeleteModal();
    }

    // Helper method to get product ID from name (if we have a products cache)
    getProductId(productName) {
        // This could be enhanced to use a cached product list
        // For now, return null to use name as fallback
        return null;
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
        // Attach submit event after (re)generating the form
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContent();
        });
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
        
        if (contentType === 'event') {
            form.innerHTML = `
                <div class="form-group">
                    <label class="form-label" for="title">Event Title *</label>
                    <input type="text" class="form-input" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="date">Event Date *</label>
                    <input type="date" class="form-input" id="date" name="date" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="time">Event Time</label>
                    <input type="time" class="form-input" id="time" name="time">
                </div>
                <div class="form-group">
                    <label class="form-label" for="location">Location</label>
                    <input type="text" class="form-input" id="location" name="location">
                </div>
                <div class="form-group">
                    <label class="form-label" for="body">Event Description *</label>
                    <textarea class="form-input form-textarea" id="body" name="body" rows="6" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="featuredImage">Featured Image URL</label>
                    <input type="text" class="form-input" id="featuredImage" name="featuredImage">
                </div>
                <div class="form-group">
                    <label class="form-label" for="status">Status *</label>
                    <select class="form-input form-select" id="status" name="status" required>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            `;
        } else if (contentType === 'blog') {
            form.innerHTML = `
                <div class="form-group">
                    <label class="form-label" for="title">Blog Title *</label>
                    <input type="text" class="form-input" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="date">Publish Date *</label>
                    <input type="date" class="form-input" id="date" name="date" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="author">Author *</label>
                    <input type="text" class="form-input" id="author" name="author" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="body">Content *</label>
                    <textarea class="form-input form-textarea" id="body" name="body" rows="8" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="excerpt">Excerpt</label>
                    <textarea class="form-input form-textarea" id="excerpt" name="excerpt" rows="3" placeholder="Brief summary of the blog post"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="tags">Tags (comma-separated)</label>
                    <input type="text" class="form-input" id="tags" name="tags" placeholder="tag1, tag2, tag3">
                </div>
                <div class="form-group">
                    <label class="form-label" for="featuredImage">Featured Image URL</label>
                    <input type="text" class="form-input" id="featuredImage" name="featuredImage">
                </div>
                <div class="form-group">
                    <label class="form-label" for="metaTitle">Meta Title</label>
                    <input type="text" class="form-input" id="metaTitle" name="metaTitle">
                </div>
                <div class="form-group">
                    <label class="form-label" for="metaDescription">Meta Description</label>
                    <textarea class="form-input form-textarea" id="metaDescription" name="metaDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="status">Status *</label>
                    <select class="form-input form-select" id="status" name="status" required>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            `;
        } else if (contentType === 'newsletter') {
            form.innerHTML = `
                <div class="form-group">
                    <label class="form-label" for="title">Newsletter Title *</label>
                    <input type="text" class="form-input" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="date">Issue Date *</label>
                    <input type="date" class="form-input" id="date" name="date" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="author">Author *</label>
                    <input type="text" class="form-input" id="author" name="author" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="body">Content *</label>
                    <textarea class="form-input form-textarea" id="body" name="body" rows="8" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="excerpt">Excerpt</label>
                    <textarea class="form-input form-textarea" id="excerpt" name="excerpt" rows="3" placeholder="Brief summary of the newsletter"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="tags">Tags (comma-separated)</label>
                    <input type="text" class="form-input" id="tags" name="tags" placeholder="tag1, tag2, tag3">
                </div>
                <div class="form-group">
                    <label class="form-label" for="featuredImage">Featured Image URL</label>
                    <input type="text" class="form-input" id="featuredImage" name="featuredImage">
                </div>
                <div class="form-group">
                    <label class="form-label" for="metaTitle">Meta Title</label>
                    <input type="text" class="form-input" id="metaTitle" name="metaTitle">
                </div>
                <div class="form-group">
                    <label class="form-label" for="metaDescription">Meta Description</label>
                    <textarea class="form-input form-textarea" id="metaDescription" name="metaDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="status">Status *</label>
                    <select class="form-input form-select" id="status" name="status" required>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            `;
        } else {
            form.innerHTML = '<div class="error">Unknown content type</div>';
        }
        // Always rebind submit event after innerHTML
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContent();
        });
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
            try {
                // Fix Bug 7: Sync preview with latest textarea content
                preview.innerHTML = this.renderMarkdown(textarea.value);
                preview.style.display = 'block';
                textarea.style.display = 'none';
            } catch (error) {
                console.error('Error rendering markdown preview:', error);
                preview.innerHTML = '<p class="error">Error rendering preview</p>';
                preview.style.display = 'block';
                textarea.style.display = 'none';
            }
        } else {
            preview.style.display = 'none';
            textarea.style.display = 'block';
            // Ensure textarea is focused when switching back
            textarea.focus();
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
                } else if (key === 'tags' && Array.isArray(data[key])) {
                    // Handle tags array - convert to comma-separated string
                    field.value = data[key].join(', ');
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

        // Fix Bug 9: Add validation before saving
        if (!this.validateFormData(data)) {
            return;
        }

        // Enhancement: Add loading spinner
        const saveButton = document.getElementById('modal-save');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;

        try {
            let response;
            
            // Check if we're editing a product
            if (this.editingItem && this.currentContentType === 'product') {
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
            } else if (this.currentContentType === 'event') {
                // Handle events
                const eventData = { ...data };
                
                // Format date to string if it's a date input
                if (eventData.date) {
                    const dateObj = new Date(eventData.date);
                    eventData.date = dateObj.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                }
                
                if (this.editingItem) {
                    response = await fetch(`${getApiUrl('api/events')}/${this.editingItem._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(eventData)
                    });
                } else {
                    response = await fetch(`${getApiUrl('api/events')}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(eventData)
                    });
                }
            } else if (this.currentContentType === 'blog') {
                // Handle blogs - prepare data for Content model with type 'blog'
                const blogData = { ...data };
                
                console.log('Original blog data:', blogData);
                
                // Process tags from comma-separated string to array
                if (blogData.tags) {
                    blogData.tags = blogData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                }
                
                // Format date to string
                if (blogData.date) {
                    const dateObj = new Date(blogData.date);
                    blogData.date = dateObj.toISOString().split('T')[0];
                }
                
                // Ensure type is set to 'blog'
                blogData.type = 'blog';
                
                console.log('Processed blog data:', blogData);
                console.log('API URL:', getApiUrl('api/blogs'));
                
                if (this.editingItem) {
                    response = await fetch(`${getApiUrl('api/blogs')}/${this.editingItem._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(blogData)
                    });
                } else {
                    response = await fetch(`${getApiUrl('api/blogs')}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(blogData)
                    });
                }
                            } else if (this.currentContentType === 'newsletter') {
                    // Handle newsletters - prepare data for Content model with type 'newsletter'
                    const newsletterData = { ...data };
                    
                    console.log('Original newsletter data:', newsletterData);
                    
                    // Process tags from comma-separated string to array
                    if (newsletterData.tags) {
                        newsletterData.tags = newsletterData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                    }
                    
                    // Format date to string
                    if (newsletterData.date) {
                        const dateObj = new Date(newsletterData.date);
                        newsletterData.date = dateObj.toISOString().split('T')[0];
                    }
                    
                    // Ensure type is set to 'newsletter'
                    newsletterData.type = 'newsletter';
                    
                    console.log('Processed newsletter data:', newsletterData);
                    console.log('API URL:', getApiUrl('api/blogs'));
                    
                    if (this.editingItem) {
                        response = await fetch(`${getApiUrl('api/blogs')}/${this.editingItem._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newsletterData)
                        });
                    } else {
                        response = await fetch(`${getApiUrl('api/blogs')}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newsletterData)
                        });
                    }
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

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response not ok:', response.status, errorText);
                throw new Error(`HTTP error: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('Response:', result);
            
            if (result.success) {
                this.hideModal();
                console.log(this.editingItem ? 'Content updated successfully!' : 'Content created successfully!');
                this.loadSectionContent(this.currentSection);
                if (this.currentSection === 'dashboard') {
                    this.loadDashboard();
                }
            } else {
                console.error('Failed to save content:', result.message);
                alert(`Failed to save content: ${result.message}`);
            }
        } catch (error) {
            console.error('Error saving content:', error);
            alert(`Error saving content: ${error.message}`);
        } finally {
            // Restore save button
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
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
            
            // Fix Bug 4: Clarify deletion logic and use consistent identifiers
            if (this.deletingItemType === 'product' && this.deletingItemId) {
                // Product deletion
                const endpoint = getApiUrl(`api/products/${encodeURIComponent(this.deletingItemId)}`);
                console.log('Deleting product:', endpoint);
                
                response = await fetch(endpoint, {
                    method: 'DELETE'
                });
            } else if (this.itemToDelete) {
                // Handle other content types based on current section
                if (this.currentSection === 'events') {
                    response = await fetch(`${getApiUrl('api/events')}/${this.itemToDelete}`, {
                        method: 'DELETE'
                    });
                } else if (this.currentSection === 'blogs' || this.currentSection === 'newsletters') {
                    response = await fetch(`${getApiUrl('api/blogs')}/${this.itemToDelete}`, {
                        method: 'DELETE'
                    });
                } else {
                    // Handle other content types (legacy CMS)
                    response = await fetch(`${this.apiBaseUrl}/content/${this.itemToDelete}`, {
                        method: 'DELETE'
                    });
                }
            } else {
                console.error('No item specified for deletion');
                return;
            }

            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const result = await response.json();
            
            if (result.success) {
                this.hideDeleteModal();
                console.log('Content deleted successfully!');
                this.loadSectionContent(this.currentSection);
                if (this.currentSection === 'dashboard') {
                    this.loadDashboard();
                }
            } else {
                console.error('Failed to delete content:', result.message);
            }
        } catch (error) {
            console.error('Error deleting content:', error);
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
        console.log('showModal called');
        const modalOverlay = document.getElementById('modal-overlay');
        console.log('modalOverlay element:', modalOverlay);
        modalOverlay.classList.add('active');
        console.log('Modal should now be visible');
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
        this.deletingItemId = null;
        this.deletingItemType = null;
    }

    // Fix Bug 9: Add form validation method
    validateFormData(data) {
        const requiredFields = [];
        
        // Define required fields based on content type
        if (this.currentContentType === 'product') {
            requiredFields.push('name', 'category');
        } else if (this.currentContentType === 'event') {
            requiredFields.push('title', 'date', 'body');
        } else if (this.currentContentType === 'blog' || this.currentContentType === 'newsletter') {
            requiredFields.push('title', 'date', 'body', 'author');
        }
        
        // Check required fields
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                alert(`Please fill in the required field: ${field}`);
                return false;
            }
        }
        
        // Validate date format
        if (data.date) {
            const dateValue = new Date(data.date);
            if (isNaN(dateValue.getTime())) {
                alert('Please enter a valid date');
                return false;
            }
        }
        
        return true;
    }

    // Fix Bug 10: Standardize date formatting
    formatDate(dateString) {
        if (!dateString) return 'No Date';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
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