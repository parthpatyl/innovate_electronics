// CMS Application JavaScript
class CMS {
    // API endpoint constants
    static API_ENDPOINTS = {
        PRODUCTS: 'api/products',
        EVENTS: 'api/events',
        BLOGS: 'api/blogs',
        NEWSLETTERS: 'api/newsletters',
        TESTIMONIALS: 'api/testimonials'
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
        // Load dashboard by default
        this.navigateToSection('dashboard');
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

    loadDashboard() {
        // Fetch counts and update UI
        fetch(getApiUrl('api/stats'))
            .then(res => res.json())
            .then(result => {
                if (result && result.success) {
                    this.updateDashboardStats(result.data || {});
                }
            })
            .catch(err => console.error('Failed to load dashboard stats:', err));
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
            newsletters: 'Newsletters',
            testimonials: 'Testimonials'
        };

        const descriptions = {
            dashboard: 'Welcome to your content management system',
            products: 'Manage your product catalog',
            events: 'Organize and schedule events',
            blogs: 'Create and edit blog posts',
            newsletters: 'Design newsletter issues',
            testimonials: 'Manage client testimonials'
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

        if (section === 'events') {
            listElement.innerHTML = content.map(eventItem => `
            <div class="content-item">
                <div class="content-info">
                    <div class="content-title">${eventItem.title || 'Untitled'}</div>
                    <div class="content-meta">
                        <span>${eventItem.location || ''}</span>
                        <span>${eventItem.date ? new Date(eventItem.date).toISOString().split('T')[0] : ''}</span>
                        <span class="content-status">${eventItem.status || ''}</span>
                    </div>
                </div>
                <div class="content-actions-btns">
                    <a class="btn btn-sm btn-info" href="event-registrations.html?event_title=${encodeURIComponent(eventItem.title || '')}">
                        <i class="fas fa-users"></i> View Registration
                    </a>
                    <button class="btn btn-sm btn-secondary" onclick="cms.editContent('${eventItem._id || eventItem.name || ''}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cms.deleteContent('${eventItem._id || eventItem.name || ''}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            `).join('');
            return;
        }

        // Example rendering logic (customize as needed for your data structure)
        listElement.innerHTML = content.map(item => {
            let editBtn;
            if (section === 'products') {
                editBtn = `<button class="btn btn-sm btn-secondary" onclick="cms.editProduct('${item._id || ''}')">
                    <i class="fas fa-edit"></i> Edit
                </button>`;
            } else {
                editBtn = `<button class="btn btn-sm btn-secondary" onclick="cms.editContent('${item._id || ''}')">
                    <i class="fas fa-edit"></i> Edit
                </button>`;
            }
            return `
            <div class="content-item">
                <div class="content-info">
                    <div class="content-title">
                        ${item.title || item.subject || item.name || 'Untitled'}
                    </div>
                    <div class="content-meta">
                        <span>${item.author || (item.sentBy && (item.sentBy.name || item.sentBy.email)) || item.category || ''}</span>
                        <span>${item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : ''}</span>
                        <span class="content-status">${item.status || ''}</span>
                    </div>
                </div>
                <div class="content-actions-btns">
                    ${editBtn}
                    <button class="btn btn-sm btn-danger" onclick="cms.deleteContent('${item._id || item.name || ''}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }


        generateForm() {
        const form = document.getElementById('content-form');
        const contentType = this.currentContentType;

        // Helper for image input and preview
        const imageInputHTML = `
            <div class="form-group">
                <label class="form-label" for="imageUpload">Upload Image</label>
                <input type="file" class="form-input" id="imageUpload" name="imageUpload" accept="image/*">
                <div id="image-preview-container" style="margin-top:8px;"></div>
            </div>
        `;

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
                ${imageInputHTML}
                <div class="form-group">
                    <label class="form-label" for="status">Status *</label>
                    <select class="form-input form-select" id="status" name="status" required>
                        <option value="upcoming">Upcoming</option>
                        <option value="archived">Archived</option>
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
                ${imageInputHTML}
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
                    <label class="form-label" for="subject">Subject *</label>
                    <input type="text" class="form-input" id="subject" name="subject" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="htmlBody">HTML Body *</label>
                    <textarea class="form-input form-textarea" id="htmlBody" name="htmlBody" rows="10" placeholder="<h1>Title</h1>..." required></textarea>
                </div>
                ${imageInputHTML}
                <div class="form-group">
                    <label class="form-label" for="status">Status *</label>
                    <select class="form-input form-select" id="status" name="status" required>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Audience</label>
                    <input type="text" class="form-input" value="All subscribers" disabled>
                </div>
            `;
        } else if (contentType === 'testimonial') {
            form.innerHTML = `
                <div class="form-group">
                    <label class="form-label" for="name">Client Name *</label>
                    <input type="text" class="form-input" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="title">Client Title/Designation</label>
                    <input type="text" class="form-input" id="title" name="title" placeholder="e.g., Senior Technology Lead">
                </div>
                <div class="form-group">
                    <label class="form-label" for="text">Testimonial Text *</label>
                    <textarea class="form-input form-textarea" id="text" name="text" rows="5" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="rating">Rating (1-5) *</label>
                    <input type="number" class="form-input" id="rating" name="rating" min="1" max="5" required>
                </div>
                ${imageInputHTML}
                <div class="form-group">
                    <label class="form-label" for="status">Status *</label>
                    <select class="form-input form-select" id="status" name="status" required>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
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

        // Image upload logic (preview and store file)
        const imageInput = document.getElementById('imageUpload');
        const previewContainer = document.getElementById('image-preview-container');
        this.selectedImageFile = null;
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                this.selectedImageFile = file || null;
                previewContainer.innerHTML = '';
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        previewContainer.innerHTML = `<img src="${evt.target.result}" alt="Preview" style="max-width:100%;max-height:120px;">`;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Bind blog autofill button when rendering blog form
        if (contentType === 'blog') {
            // No sample autofill or create buttons
        }

        // Newsletter-specific dynamic behavior
        if (contentType === 'newsletter') {
            const audienceEl = document.getElementById('audience');
            const recipientsGroupEl = document.getElementById('recipients-group');
            const recipientsEl = document.getElementById('recipients');
            if (audienceEl && recipientsGroupEl && recipientsEl) {
                const updateRecipientsVisibility = () => {
                    if (audienceEl.value === 'custom') {
                        recipientsGroupEl.style.display = 'block';
                        recipientsEl.required = true;
                    } else {
                        recipientsGroupEl.style.display = 'none';
                        recipientsEl.required = false;
                    }
                };
                audienceEl.addEventListener('change', updateRecipientsVisibility);
                updateRecipientsVisibility();
            }
        }
    }

        generateProductForm() {
        const form = document.getElementById('content-form');
        // Add image upload input and preview
        const imageInputHTML = `
            <div class="form-group">
                <label class="form-label" for="imageUpload">Upload Image</label>
                <input type="file" class="form-input" id="imageUpload" name="imageUpload" accept="image/*">
                <div id="image-preview-container" style="margin-top:8px;"></div>
            </div>
        `;

        form.innerHTML = `
            <div class="form-group">
                <label class="form-label" for="name">Product Name *</label>
                <input type="text" class="form-input" id="name" name="name" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="category">Category *</label>
                <select class="form-input form-select" id="category" name="category" required>
                    <option value="">Select a Category</option>
                    <option value="RF and Microwave">RF and Microwave</option>
                    <option value="Test & Measurement">Test & Measurement</option>
                    <option value="Speciality Materials">Speciality Materials</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="subcategory">Subcategory</label>
                <select class="form-input form-select" id="subcategory" name="subcategory">
                    <option value="">Select a category first</option>
                </select>
            </div>
            ${imageInputHTML}
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

        // Image upload logic (preview and store file)
        const imageInput = document.getElementById('imageUpload');
        const previewContainer = document.getElementById('image-preview-container');
        this.selectedImageFile = null;
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                this.selectedImageFile = file || null;
                previewContainer.innerHTML = '';
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        previewContainer.innerHTML = `<img src="${evt.target.result}" alt="Preview" style="max-width:100%;max-height:120px;">`;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // --- Dependent Dropdown Logic ---
        const categoryDropdown = document.getElementById('category');
        const subcategoryDropdown = document.getElementById('subcategory');

        const subcategoryMap = {
            "RF and Microwave": [
                "Switches", "Cable Assembly", "Waveguides", "Amplifiers", "Filters",
                "Passive Components", "Antennas"
            ],
            "Test & Measurement": [
                "Vibration Test Machine", "Environmental Chamber", "EMI EMC Chamber",
                "Anechoic Chamber", "EMI EMC Scanner/Probe", "Reverberation Chamber"
            ],
            "Speciality Materials": [
                "Rohacell Sheets", "Rohacell Shapes", "Composite Components",
                "Acoustic Insulation", "Thermal Insulation", "Turnkey Solution"
            ]
        };

        categoryDropdown.addEventListener('change', (e) => {
            const selectedCategory = e.target.value;
            const subcategories = subcategoryMap[selectedCategory] || [];

            // Clear current subcategory options
            subcategoryDropdown.innerHTML = '';

            if (subcategories.length > 0) {
                // Add a default option
                const defaultOption = new Option('Select a Subcategory', '');
                subcategoryDropdown.add(defaultOption);

                // Populate with new options
                subcategories.forEach(sub => {
                    const option = new Option(sub, sub);
                    subcategoryDropdown.add(option);
                });
            } else {
                // If no subcategories, show a relevant message
                subcategoryDropdown.innerHTML = '<option value="">No subcategories available</option>';
            }
        });
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
                
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const data = await response.json();
                return data.success ? data.data : [];
            }
            if (contentType === 'event') {
                const endpoint = getApiUrl('api/events?status=all');
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const data = await response.json();
                return data.success ? data.data : [];
            }
            if (contentType === 'blog') {
                const endpoint = getApiUrl('api/blogs?status=all');
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const data = await response.json();
                return data.success ? data.data : [];
            }
            if (contentType === 'newsletter') {
                // Newsletters are managed as campaigns via dedicated endpoint
                const endpoint = getApiUrl('api/newsletters');
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const data = await response.json();
                return data.success ? data.data : [];
            }
            if (contentType === 'testimonial') {
                const endpoint = getApiUrl('api/testimonials?status=all');
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
        document.getElementById('testimonials-count').textContent = stats.testimonials || 0;
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

    // Product-specific methods
    async viewProduct(productName) {
        try {
            // Fix Bug 3: Use product ID if available, fallback to name
            const productId = this.getProductId(productName);
            const endpoint = getApiUrl(`api/products/${encodeURIComponent(productId || productName)}`);
            
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

    // Refactored editProduct to use productId directly (like deleteProduct)
    async editProduct(productId) {
        try {
            this.editingItem = null;
            const endpoint = getApiUrl(`api/products/${encodeURIComponent(productId)}`);
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
        // Store the current image for later use in save
        this.currentProductImage = product.image || '';
        // Show preview if editing and image exists
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer && product.image) {
            previewContainer.innerHTML = `<img src="${product.image}" alt="Preview" style="max-width:100%;max-height:120px;">`;
        }
        
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

        // If image file is selected, read as base64 and add to data
        if (this.selectedImageFile) {
            data.uploadedImage = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(this.selectedImageFile);
            });
        } else {
            data.uploadedImage = '';
        }

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
                'newsletter': () => this.saveNewsletter(data),
                'testimonial': () => this.saveTestimonial(data)
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
        // Attach uploaded image (base64) if present
        if (formData.uploadedImage) {
            eventData.imageData = formData.uploadedImage;
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
        // Never send slug from client
        delete blogData.slug;
        // Attach uploaded image (base64) if present
        if (formData.uploadedImage) {
            blogData.imageData = formData.uploadedImage;
        }
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
            subject: formData.subject,
            htmlBody: formData.htmlBody,
            status: formData.status || 'draft',
            audience: 'all-subscribers',
            recipients: []
        };
        // Attach uploaded image (base64) if present
        if (formData.uploadedImage) {
            newsletterData.imageData = formData.uploadedImage; // This key is processed by the backend
        }
        const endpoint = this.isEditing()
            ? `${getApiUrl(CMS.API_ENDPOINTS.NEWSLETTERS)}/${this.editingItem._id}`
            : getApiUrl(CMS.API_ENDPOINTS.NEWSLETTERS);

        const response = await fetch(endpoint, {
            method: this.isEditing() ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newsletterData)
        });

        // Show feedback to admin
        let result;
        try {
            result = await this.handleApiResponse(response);
            if (newsletterData.status === 'published') {
                alert('Newsletter published and sent to all subscribers!');
            } else {
                alert('Newsletter saved as draft.');
            }
        } catch (err) {
            alert('Failed to save or send newsletter: ' + err.message);
            throw err;
        }
        return result;
    }

    async saveTestimonial(formData) {
        const testimonialData = { ...formData };
        // Attach uploaded image (base64) if present
        if (formData.uploadedImage) {
            testimonialData.image = formData.uploadedImage;
        }
        delete testimonialData.uploadedImage;

        const endpoint = this.isEditing()
            ? `${getApiUrl(CMS.API_ENDPOINTS.TESTIMONIALS)}/${this.editingItem._id}`
            : getApiUrl(CMS.API_ENDPOINTS.TESTIMONIALS);

        const response = await fetch(endpoint, {
            method: this.isEditing() ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testimonialData)
        });

        return this.handleApiResponse(response);
    }

    prepareProductData(formData) {
        const productData = {
            name: formData.name,
            category: formData.category,
            // Use uploaded image if present, else use the current image (for edit)
            image: formData.uploadedImage || this.currentProductImage || ''
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

    async deleteContent(id) {
        this.itemToDelete = id;
        this.showDeleteModal();
    }

    async confirmDelete() {
        try {
            let response;
            
            // Fix Bug 4: Clarify deletion logic and use consistent identifiers
            if (this.deletingItemType === 'product' && this.deletingItemId) {
                // Product deletion
                const endpoint = getApiUrl(`api/products/${encodeURIComponent(this.deletingItemId)}`);
                
                response = await fetch(endpoint, {
                    method: 'DELETE'
                });
            } else if (this.itemToDelete) {
                // Handle other content types based on current section
                if (this.currentSection === 'events') {
                    response = await fetch(`${getApiUrl('api/events')}/${this.itemToDelete}`, {
                        method: 'DELETE'
                    });
                } else if (this.currentSection === 'blogs') {
                    response = await fetch(`${getApiUrl('api/blogs')}/${this.itemToDelete}`, {
                        method: 'DELETE'
                    });
                } else if (this.currentSection === 'newsletters') {
                    response = await fetch(`${getApiUrl('api/newsletters')}/${this.itemToDelete}`, {
                        method: 'DELETE'
                    });
                } else if (this.currentSection === 'testimonials') {
                    response = await fetch(`${getApiUrl('api/testimonials')}/${this.itemToDelete}`, {
                        method: 'DELETE'
                    });
                } else {
                    // Handle other content types (legacy CMS)
                    response = await fetch(`${this.apiBaseUrl}/products/${this.itemToDelete}`, {
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
        
        // You can implement debounced search here
    }

    showModal() {
        
        const modalOverlay = document.getElementById('modal-overlay');
        
        modalOverlay.classList.add('active');
        
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
            requiredFields.push(this.currentContentType === 'blog' ? 'title' : 'subject', 'htmlBody');
            if (this.currentContentType === 'blog') requiredFields.push('date', 'body', 'author');
        } else if (this.currentContentType === 'testimonial') {
            requiredFields.push('name', 'text', 'rating');
        }
        
        // Check required fields
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                alert(`Please fill in the required field: ${field}`);
                return false;
            }
        }
        
        // Additional newsletter validation for custom audience
        if (this.currentContentType === 'newsletter' && data.audience === 'custom') {
            const parsedRecipients = (data.recipients || '')
                .split(/[\n,]/)
                .map(v => v.trim())
                .filter(Boolean);
            if (parsedRecipients.length === 0) {
                alert('Please provide at least one recipient email');
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

    // Add generic editor for blogs/newsletters based on current section
    async editContent(id) {
        try {
            let endpoint = null;
            let type = null;
            if (this.currentSection === 'blogs') {
                type = 'blog';
                endpoint = `${getApiUrl('api/blogs')}/${id}`;
            } else if (this.currentSection === 'newsletters') {
                type = 'newsletter';
                endpoint = `${getApiUrl('api/newsletters')}/${id}`;
            } else if (this.currentSection === 'events') {
                type = 'event';
                endpoint = `${getApiUrl('api/events')}/${id}`;
            } else if (this.currentSection === 'testimonials') {
                type = 'testimonial';
                endpoint = `${getApiUrl('api/testimonials')}/${id}`;
            }

            if (!endpoint) return;

            const res = await fetch(endpoint);
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
            const result = await res.json();
            if (!result.success) return;

            this.editingItem = result.data;
            this.currentContentType = type;
            document.getElementById('modal-title').textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            
            if (type === 'blog') {
                this.generateForm();
                // Populate blog fields
                document.getElementById('title').value = this.editingItem.title || '';
                document.getElementById('date').value = this.editingItem.date ? new Date(this.editingItem.date).toISOString().split('T')[0] : '';
                document.getElementById('author').value = this.editingItem.author || '';
                document.getElementById('body').value = this.editingItem.body || '';
                const tagsStr = Array.isArray(this.editingItem.tags) ? this.editingItem.tags.join(', ') : '';
                const excerptEl = document.getElementById('excerpt'); if (excerptEl) excerptEl.value = this.editingItem.excerpt || '';
                const tagsEl = document.getElementById('tags'); if (tagsEl) tagsEl.value = tagsStr;
                document.getElementById('status').value = this.editingItem.status || 'draft';
            } else if (type === 'newsletter') {
                this.generateForm();
                document.getElementById('subject').value = this.editingItem.subject || '';
                document.getElementById('htmlBody').value = this.editingItem.htmlBody || '';
                const statusEl = document.getElementById('status'); if (statusEl) statusEl.value = this.editingItem.status || 'draft';
                const audienceEl = document.getElementById('audience'); if (audienceEl && this.editingItem.audience) audienceEl.value = this.editingItem.audience;
                const recipientsEl = document.getElementById('recipients'); if (recipientsEl && Array.isArray(this.editingItem.recipients)) recipientsEl.value = this.editingItem.recipients.join(', ');
                // Ensure recipients visibility reflects edited audience
                const recipientsGroupEl = document.getElementById('recipients-group');
                if (audienceEl && recipientsGroupEl && recipientsEl) {
                    if (audienceEl.value === 'custom') {
                        recipientsGroupEl.style.display = 'block';
                        recipientsEl.required = true;
                    } else {
                        recipientsGroupEl.style.display = 'none';
                        recipientsEl.required = false;
                    }
                }
            } else if (type === 'event') {
                this.generateForm();
                document.getElementById('title').value = this.editingItem.title || '';
                document.getElementById('date').value = this.editingItem.date ? new Date(this.editingItem.date).toISOString().split('T')[0] : '';
                const timeEl = document.getElementById('time'); if (timeEl) timeEl.value = this.editingItem.time || '';
                const locEl = document.getElementById('location'); if (locEl) locEl.value = this.editingItem.location || '';
                document.getElementById('body').value = this.editingItem.body || '';
                document.getElementById('status').value = this.editingItem.status || 'upcoming';
            }
            else if (type === 'testimonial') {
                this.generateForm();
                document.getElementById('name').value = this.editingItem.name || '';
                document.getElementById('title').value = this.editingItem.title || '';
                document.getElementById('text').value = this.editingItem.text || '';
                document.getElementById('rating').value = this.editingItem.rating || 5;
                document.getElementById('status').value = this.editingItem.status || 'published';
            }

            this.showModal();
        } catch (error) {
            console.error('Error loading content for edit:', error);
        }
    }


}

// Initialize CMS when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cms = new CMS();
});