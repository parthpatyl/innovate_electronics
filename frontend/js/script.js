// CMS Application JavaScript
class CMS {
    // API endpoint constants
    static API_ENDPOINTS = {
        PRODUCTS: 'api/products',
        EVENTS: 'api/events',
        BLOGS: 'api/blogs',
        NEWSLETTERS: 'api/newsletters'
    };

    constructor() {
        this.currentSection = 'dashboard';
        this.currentContentType = null;
        this.editingItem = null;
        this.apiBaseUrl = getApiUrl('api');
        this._formBound = false; // Add guard property
        this._isSaving = false; // Prevent double submissions
        
        this.init();
    }

    isEditing() {
        return !!this.editingItem;
    }

    async handleApiResponse(response, operation = 'save') {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error (${response.status}): ${errorText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || `Failed to ${operation} content`);
        }
        return result;
    }

    init() {
        this.bindEvents();
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
        const modalSaveBtn = document.getElementById('modal-save');
        // Ensure it doesn't trigger native submit if inside a form
        if (modalSaveBtn && modalSaveBtn.getAttribute('type') !== 'button') {
            modalSaveBtn.setAttribute('type', 'button');
        }
        modalSaveBtn.addEventListener('click', () => {
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
            this.currentContentType = section.slice(0, -1);
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

    // Add this method to render the content list for each section
    renderContentList(content, section) {
        const listElement = document.getElementById(`${section}-list`);
        if (!listElement) return;

        if (!content || content.length === 0) {
            listElement.innerHTML = `<div class="empty-state">No items found.</div>`;
            return;
        }

        // Example rendering logic (customize as needed for your data structure)
        listElement.innerHTML = content.map(item => `
            <div class="content-item">
                <div class="content-info">
                    <div class="content-title">${item.title || item.name || 'Untitled'}</div>
                    <div class="content-meta">
                        <span>${item.author || item.category || ''}</span>
                        <span>${item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : ''}</span>
                        <span class="content-status">${item.status || ''}</span>
                    </div>
                </div>
                <div class="content-actions-btns">
                    <button class="btn btn-sm btn-secondary" onclick="cms.editContent('${item.slug || item._id || item.name || ''}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cms.deleteContent('${item.slug || item._id || item.name || ''}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
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
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveContent();
        };
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
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveContent();
        };
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

    async fetchContent(contentType, filters = {}) {
        try {
            if (contentType === 'product') {
                const queryParams = new URLSearchParams();

                const endpoint = getApiUrl(`api/products`);
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
                const endpoint = getApiUrl('api/newsletters');
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

    async saveContent() {
        if (this._isSaving) {
            return;
        }
        this._isSaving = true;

        const form = document.getElementById('content-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (!this.validateFormData(data)) {
            this._isSaving = false;
            return;
        }

        try {
            let result;

            // Map content types to their respective save methods
            const contentHandlers = {
                'product': () => this.saveProduct(data),
                'event': () => this.saveEvent(data),
                'blog': () => this.saveBlog(data),
                'newsletter': () => this.saveNewsletter(data)
            };

            const handler = contentHandlers[this.currentContentType];
            if (handler) {
                result = await handler();
            } else {
                throw new Error(`Unsupported content type: ${this.currentContentType}`);
            }

            this.hideModal();
        } catch (error) {
            console.error('Error saving content:', error);
            alert(`Error saving content: ${error.message}`);
        } finally {
            this._isSaving = false;
        }
    }

    async saveProduct(formData) {
        const productData = this.prepareProductData(formData);
        const endpoint = this.isEditing() 
            ? `${getApiUrl(CMS.API_ENDPOINTS.PRODUCTS)}/${encodeURIComponent(this.editingItem.name)}`
            : getApiUrl(CMS.API_ENDPOINTS.PRODUCTS);

        const response = await fetch(endpoint, {
            method: this.isEditing() ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        return this.handleApiResponse(response);
    }

    async saveEvent(formData) {
        const eventData = { ...formData };
        if (eventData.date) {
            eventData.date = new Date(eventData.date).toISOString().split('T')[0];
        }

        const endpoint = this.isEditing()
            ? `${getApiUrl(CMS.API_ENDPOINTS.EVENTS)}/${this.editingItem._id}`
            : getApiUrl(CMS.API_ENDPOINTS.EVENTS);

        const response = await fetch(endpoint, {
            method: this.isEditing() ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        return this.handleApiResponse(response);
    }

    async saveBlog(formData) {
        const blogData = {
            ...formData,
            type: 'blog',
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            date: formData.date ? new Date(formData.date).toISOString().split('T')[0] : undefined
        };

        const endpoint = this.isEditing()
            ? `${getApiUrl(CMS.API_ENDPOINTS.BLOGS)}/${this.editingItem._id}`
            : getApiUrl(CMS.API_ENDPOINTS.BLOGS);

        const response = await fetch(endpoint, {
            method: this.isEditing() ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blogData)
        });

        return this.handleApiResponse(response);
    }

    async saveNewsletter(formData) {
        const newsletterData = {
            ...formData,
            type: 'newsletter',
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            date: formData.date ? new Date(formData.date).toISOString().split('T')[0] : undefined
        };

        // Using dedicated newsletters endpoint
        const endpoint = this.isEditing()
            ? `${getApiUrl(CMS.API_ENDPOINTS.NEWSLETTERS)}/${this.editingItem._id}`
            : getApiUrl(CMS.API_ENDPOINTS.NEWSLETTERS);

        const response = await fetch(endpoint, {
            method: this.isEditing() ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newsletterData)
        });

        return this.handleApiResponse(response);
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