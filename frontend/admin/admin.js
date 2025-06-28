// Admin Panel JavaScript
class NewsletterAdmin {
    constructor() {
        this.token = localStorage.getItem('adminToken');
        this.currentUser = JSON.parse(localStorage.getItem('adminUser'));
        this.currentPage = 1;
        this.currentSection = 'dashboard';
        
        this.init();
    }

    init() {
        if (!this.token) {
            this.showLoginForm();
            return;
        }

        this.setupEventListeners();
        this.loadDashboard();
        this.updateUserInfo();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(e.target.closest('.nav-link').dataset.section);
            });
        });

        // Search and filters
        document.getElementById('subscriber-search').addEventListener('input', 
            debounce(() => this.loadSubscribers(), 500));
        
        document.getElementById('subscriber-sort').addEventListener('change', 
            () => this.loadSubscribers());
        
        document.getElementById('campaign-status-filter').addEventListener('change', 
            () => this.loadCampaigns());

        // Campaign form
        document.getElementById('campaign-target').addEventListener('change', 
            () => this.toggleTargetOptions());
        
        document.getElementById('campaign-form').addEventListener('submit', 
            (e) => this.saveCampaign(e));

        // Profile forms
        document.getElementById('profile-form').addEventListener('submit', 
            (e) => this.updateProfile(e));
        
        document.getElementById('password-form').addEventListener('submit', 
            (e) => this.changePassword(e));
    }

    async makeRequest(url, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                    return null;
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('Request error:', error);
            this.showNotification(error.message, 'error');
            return null;
        }
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        // Show selected section
        document.getElementById(section).style.display = 'block';
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'subscribers': 'Subscribers',
            'campaigns': 'Campaigns',
            'create-campaign': 'Create Campaign',
            'profile': 'Profile'
        };
        document.getElementById('page-title').textContent = titles[section];

        // Load section data
        this.currentSection = section;
        switch (section) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'subscribers':
                this.loadSubscribers();
                break;
            case 'campaigns':
                this.loadCampaigns();
                break;
        }
    }

    async loadDashboard() {
        try {
            const [subscriberStats, campaignStats] = await Promise.all([
                this.makeRequest('/api/newsletter/stats'),
                this.makeRequest('/api/campaigns/stats')
            ]);

            if (subscriberStats) {
                document.getElementById('total-subscribers').textContent = subscriberStats.data.totalSubscribers;
            }

            if (campaignStats) {
                document.getElementById('total-campaigns').textContent = campaignStats.data.totalCampaigns;
                document.getElementById('emails-sent').textContent = campaignStats.data.totalEmailsSent;
                document.getElementById('failed-emails').textContent = campaignStats.data.failedCampaigns;
            }

            this.loadRecentCampaigns();
        } catch (error) {
            console.error('Dashboard load error:', error);
        }
    }

    async loadRecentCampaigns() {
        const campaigns = await this.makeRequest('/api/campaigns?limit=5&status=sent');
        if (!campaigns) return;

        const tbody = document.querySelector('#recent-campaigns-table tbody');
        tbody.innerHTML = '';

        if (campaigns.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading">No campaigns found</td></tr>';
            return;
        }

        campaigns.data.forEach(campaign => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${campaign.subject}</td>
                <td><span class="badge badge-success">Sent</span></td>
                <td>${campaign.sentCount}</td>
                <td>${campaign.recipientCount}</td>
                <td>${new Date(campaign.sentAt).toLocaleDateString()}</td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadSubscribers(page = 1) {
        const search = document.getElementById('subscriber-search').value;
        const sortBy = document.getElementById('subscriber-sort').value;
        
        const params = new URLSearchParams({
            page,
            limit: 20,
            sortBy,
            sortOrder: 'desc'
        });

        if (search) params.append('search', search);

        const response = await this.makeRequest(`/api/newsletter/subscribers?${params}`);
        if (!response) return;

        this.renderSubscribersTable(response.data, response.pagination);
    }

    renderSubscribersTable(subscribers, pagination) {
        const tbody = document.querySelector('#subscribers-table tbody');
        tbody.innerHTML = '';

        if (subscribers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">No subscribers found</td></tr>';
            return;
        }

        subscribers.forEach(subscriber => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subscriber.email}</td>
                <td>${subscriber.firstName || ''} ${subscriber.lastName || ''}</td>
                <td>${subscriber.preferences?.categories?.join(', ') || 'All'}</td>
                <td>${subscriber.preferences?.frequency || 'monthly'}</td>
                <td>${new Date(subscriber.subscribedAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="admin.deleteSubscriber('${subscriber._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.renderPagination('subscribers-pagination', pagination, (page) => this.loadSubscribers(page));
    }

    async deleteSubscriber(id) {
        if (!confirm('Are you sure you want to delete this subscriber?')) return;

        const response = await this.makeRequest(`/api/newsletter/subscribers/${id}`, {
            method: 'DELETE'
        });

        if (response) {
            this.showNotification('Subscriber deleted successfully', 'success');
            this.loadSubscribers();
        }
    }

    async loadCampaigns(page = 1) {
        const status = document.getElementById('campaign-status-filter').value;
        
        const params = new URLSearchParams({
            page,
            limit: 20
        });

        if (status) params.append('status', status);

        const response = await this.makeRequest(`/api/campaigns?${params}`);
        if (!response) return;

        this.renderCampaignsTable(response.data, response.pagination);
    }

    renderCampaignsTable(campaigns, pagination) {
        const tbody = document.querySelector('#campaigns-table tbody');
        tbody.innerHTML = '';

        if (campaigns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading">No campaigns found</td></tr>';
            return;
        }

        campaigns.forEach(campaign => {
            const statusBadge = this.getStatusBadge(campaign.status);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${campaign.subject}</td>
                <td>${statusBadge}</td>
                <td>${campaign.targetAudience}</td>
                <td>${campaign.recipientCount}</td>
                <td>${campaign.sentCount}</td>
                <td>${campaign.successRate}%</td>
                <td>${new Date(campaign.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="admin.viewCampaign('${campaign._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${campaign.status === 'draft' ? `
                        <button class="btn btn-success btn-sm" onclick="admin.sendCampaign('${campaign._id}')">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="admin.deleteCampaign('${campaign._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });

        this.renderPagination('campaigns-pagination', pagination, (page) => this.loadCampaigns(page));
    }

    getStatusBadge(status) {
        const badges = {
            'draft': '<span class="badge badge-info">Draft</span>',
            'sending': '<span class="badge badge-warning">Sending</span>',
            'sent': '<span class="badge badge-success">Sent</span>',
            'failed': '<span class="badge badge-danger">Failed</span>'
        };
        return badges[status] || status;
    }

    toggleTargetOptions() {
        const target = document.getElementById('campaign-target').value;
        const specificGroup = document.getElementById('specific-emails-group');
        const filterGroup = document.getElementById('filter-group');

        specificGroup.style.display = target === 'specific' ? 'block' : 'none';
        filterGroup.style.display = target === 'filtered' ? 'block' : 'none';
    }

    async saveCampaign(e) {
        e.preventDefault();

        const formData = this.getCampaignFormData();
        if (!formData) return;

        const response = await this.makeRequest('/api/campaigns', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (response) {
            this.showNotification('Campaign saved successfully', 'success');
            document.getElementById('campaign-form').reset();
            this.showSection('campaigns');
        }
    }

    getCampaignFormData() {
        const subject = document.getElementById('campaign-subject').value;
        const body = document.getElementById('campaign-body').value;
        const targetAudience = document.getElementById('campaign-target').value;
        const scheduledFor = document.getElementById('campaign-schedule').value;

        if (!subject || !body) {
            this.showNotification('Please fill in all required fields', 'error');
            return null;
        }

        const data = {
            subject,
            body,
            htmlBody: body,
            targetAudience
        };

        if (scheduledFor) {
            data.scheduledFor = new Date(scheduledFor).toISOString();
        }

        if (targetAudience === 'specific') {
            const emails = document.getElementById('campaign-specific-emails').value
                .split('\n')
                .map(email => email.trim())
                .filter(email => email);
            data.specificEmails = emails;
        }

        if (targetAudience === 'filtered') {
            const categories = Array.from(document.getElementById('filter-categories').selectedOptions)
                .map(option => option.value);
            const frequency = document.getElementById('filter-frequency').value;

            data.filters = {};
            if (categories.length > 0) data.filters.categories = categories;
            if (frequency) data.filters.frequency = frequency;
        }

        return data;
    }

    async sendCampaign(campaignId = null) {
        const id = campaignId || this.currentCampaignId;
        if (!id) return;

        if (!confirm('Are you sure you want to send this campaign?')) return;

        const response = await this.makeRequest(`/api/campaigns/${id}/send`, {
            method: 'POST'
        });

        if (response) {
            this.showNotification(`Campaign sent successfully. ${response.data.sentCount} emails sent.`, 'success');
            this.loadCampaigns();
        }
    }

    async deleteCampaign(id) {
        if (!confirm('Are you sure you want to delete this campaign?')) return;

        const response = await this.makeRequest(`/api/campaigns/${id}`, {
            method: 'DELETE'
        });

        if (response) {
            this.showNotification('Campaign deleted successfully', 'success');
            this.loadCampaigns();
        }
    }

    async viewCampaign(id) {
        const response = await this.makeRequest(`/api/campaigns/${id}`);
        if (!response) return;

        const campaign = response.data;
        const modal = document.getElementById('campaign-modal');
        const modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = `
            <div style="margin-bottom: 20px;">
                <strong>Subject:</strong> ${campaign.subject}
            </div>
            <div style="margin-bottom: 20px;">
                <strong>Status:</strong> ${this.getStatusBadge(campaign.status)}
            </div>
            <div style="margin-bottom: 20px;">
                <strong>Target Audience:</strong> ${campaign.targetAudience}
            </div>
            <div style="margin-bottom: 20px;">
                <strong>Recipients:</strong> ${campaign.recipientCount}
            </div>
            <div style="margin-bottom: 20px;">
                <strong>Sent:</strong> ${campaign.sentCount}
            </div>
            <div style="margin-bottom: 20px;">
                <strong>Success Rate:</strong> ${campaign.successRate}%
            </div>
            <div style="margin-bottom: 20px;">
                <strong>Created:</strong> ${new Date(campaign.createdAt).toLocaleString()}
            </div>
            ${campaign.sentAt ? `
                <div style="margin-bottom: 20px;">
                    <strong>Sent:</strong> ${new Date(campaign.sentAt).toLocaleString()}
                </div>
            ` : ''}
            <div style="margin-bottom: 20px;">
                <strong>Content:</strong>
                <div style="border: 1px solid #ddd; padding: 15px; margin-top: 10px; background: #f9f9f9;">
                    ${campaign.htmlBody}
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('campaign-modal').style.display = 'none';
    }

    async updateProfile(e) {
        e.preventDefault();

        const username = document.getElementById('profile-username').value;
        const email = document.getElementById('profile-email').value;

        const response = await this.makeRequest('/api/admin/profile', {
            method: 'PUT',
            body: JSON.stringify({ username, email })
        });

        if (response) {
            this.showNotification('Profile updated successfully', 'success');
            this.updateUserInfo();
        }
    }

    async changePassword(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        const response = await this.makeRequest('/api/admin/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (response) {
            this.showNotification('Password changed successfully', 'success');
            document.getElementById('password-form').reset();
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.username;
            document.getElementById('user-role').textContent = this.currentUser.role;
            document.getElementById('user-avatar').textContent = this.currentUser.username.charAt(0).toUpperCase();
            
            document.getElementById('profile-username').value = this.currentUser.username;
            document.getElementById('profile-email').value = this.currentUser.email;
        }
    }

    renderPagination(containerId, pagination, callback) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (pagination.totalPages <= 1) return;

        const { currentPage, totalPages, hasNext, hasPrev } = pagination;

        // Previous button
        if (hasPrev) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = 'Previous';
            prevBtn.onclick = () => callback(currentPage - 1);
            container.appendChild(prevBtn);
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                const pageBtn = document.createElement('button');
                pageBtn.textContent = i;
                pageBtn.className = i === currentPage ? 'active' : '';
                pageBtn.onclick = () => callback(i);
                container.appendChild(pageBtn);
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '8px 12px';
                container.appendChild(ellipsis);
            }
        }

        // Next button
        if (hasNext) {
            const nextBtn = document.createElement('button');
            nextBtn.textContent = 'Next';
            nextBtn.onclick = () => callback(currentPage + 1);
            container.appendChild(nextBtn);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.reload();
    }

    showLoginForm() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    width: 100%;
                    max-width: 400px;
                ">
                    <h2 style="text-align: center; margin-bottom: 30px; color: #333;">Admin Login</h2>
                    <form id="login-form">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Username</label>
                            <input type="text" id="login-username" required style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #e1e5e9;
                                border-radius: 5px;
                                font-size: 16px;
                            ">
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Password</label>
                            <input type="password" id="login-password" required style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #e1e5e9;
                                border-radius: 5px;
                                font-size: 16px;
                            ">
                        </div>
                        <button type="submit" style="
                            width: 100%;
                            padding: 12px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 5px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                        ">Login</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('adminToken', data.data.token);
                    localStorage.setItem('adminUser', JSON.stringify(data.data.admin));
                    window.location.reload();
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (error) {
                alert('Login failed. Please try again.');
            }
        });
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize admin panel
const admin = new NewsletterAdmin();

// Global functions for onclick handlers
window.logout = () => admin.logout();
window.closeModal = () => admin.closeModal(); 