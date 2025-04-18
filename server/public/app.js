// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// Global session state
const sessionState = {
    eventCode: null,
    participantId: null,
    displayName: null,
    responses: [],
    matchId: null,
    matchParticipantId: null,
    questions: [],
    auth: {
        token: localStorage.getItem('authToken'),
        user: null,
        isHost: false,
        isAuthenticated: false
    },
    socket: null
};

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    const sidebarLinks = document.querySelectorAll('#sidebar a');
    const contentSections = document.querySelectorAll('.content-section');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active link
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            const targetSection = this.getAttribute('data-section');
            contentSections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(targetSection).classList.add('active');
        });
    });
    
    // Host Controls
    const createEventForm = document.getElementById('create-event-form');
    const useDefaultQuestionsCheckbox = document.getElementById('use-default-questions');
    const customQuestionsContainer = document.getElementById('custom-questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const getEventForm = document.getElementById('get-event-form');
    const startEventForm = document.getElementById('start-event-form');
    
    // Participant Actions
    const joinEventForm = document.getElementById('join-event-form');
    const questionnaireForm = document.getElementById('questionnaire-form');
    const outfitForm = document.getElementById('outfit-form');
    
    // Voting System
    const loadOutfitsBtn = document.getElementById('load-outfits-btn');
    const loadLeaderboardBtn = document.getElementById('load-leaderboard-btn');
    
    // Matchmaking
    const triggerMatchmakingForm = document.getElementById('trigger-matchmaking-form');
    const viewMatchBtn = document.getElementById('view-match-btn');
    
    // Follow-Up System
    const followupForm = document.getElementById('followup-form');
    const reconnectCheckbox = document.getElementById('reconnect-checkbox');
    const contactInfoContainer = document.getElementById('contact-info-container');
    const checkMatchInterestBtn = document.getElementById('check-match-interest-btn');
    const followupStatsForm = document.getElementById('followup-stats-form');
    
    // Real-time Features
    const chatForm = document.getElementById('chat-form');
    
    // Add image preview functionality
    const outfitImageInput = document.getElementById('outfit-image');
    const outfitImagePreview = document.getElementById('outfit-image-preview');
    
    outfitImageInput.addEventListener('change', function() {
        // Clear existing preview
        outfitImagePreview.src = '';
        outfitImagePreview.classList.add('d-none');
        
        // Check if a file was selected
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                outfitImagePreview.src = e.target.result;
                outfitImagePreview.classList.remove('d-none');
            };
            
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // QR Code Generation and Scanning
    const generateQRForm = document.getElementById('generate-qr-form');
    const startScannerBtn = document.getElementById('start-scanner-btn');
    const stopScannerBtn = document.getElementById('stop-scanner-btn');
    
    // Check for join parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const joinEventCode = urlParams.get('join');
    
    if (joinEventCode) {
        // Auto-fill the join form
        document.getElementById('event-code-join').value = joinEventCode;
        
        // Switch to participant section
        document.querySelector('#sidebar a[data-section="participant-section"]').click();
        
        showToast('Info', `Event code ${joinEventCode} detected. Enter your display name and join the event.`);
    }
    
    // Event Listeners
    
    // Toggle custom questions
    useDefaultQuestionsCheckbox.addEventListener('change', function() {
        customQuestionsContainer.style.display = this.checked ? 'none' : 'block';
    });
    
    // Add question
    addQuestionBtn.addEventListener('click', function() {
        const questionsList = document.getElementById('questions-list');
        const newQuestion = document.createElement('div');
        newQuestion.className = 'question-item mb-3';
        newQuestion.innerHTML = `
            <input type="text" class="form-control mb-2" placeholder="Question text">
            <div class="options-container">
                <input type="text" class="form-control mb-1" placeholder="Option 1">
                <input type="text" class="form-control mb-1" placeholder="Option 2">
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary mt-1 add-option-btn">+ Add Option</button>
        `;
        questionsList.appendChild(newQuestion);
        
        // Add event listener to the new "Add Option" button
        newQuestion.querySelector('.add-option-btn').addEventListener('click', function() {
            const optionsContainer = this.previousElementSibling;
            const optionCount = optionsContainer.children.length + 1;
            const newOption = document.createElement('input');
            newOption.type = 'text';
            newOption.className = 'form-control mb-1';
            newOption.placeholder = `Option ${optionCount}`;
            optionsContainer.appendChild(newOption);
        });
    });
    
    // Add event listener to existing "Add Option" buttons
    document.querySelectorAll('.add-option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const optionsContainer = this.previousElementSibling;
            const optionCount = optionsContainer.children.length + 1;
            const newOption = document.createElement('input');
            newOption.type = 'text';
            newOption.className = 'form-control mb-1';
            newOption.placeholder = `Option ${optionCount}`;
            optionsContainer.appendChild(newOption);
        });
    });
    
    // Toggle contact info
    reconnectCheckbox.addEventListener('change', function() {
        contactInfoContainer.style.display = this.checked ? 'block' : 'none';
    });
    
    // Form Submissions
    
    // Create Event
    createEventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Check if user is authorized as host
        if (!checkHostAuthorization()) {
            return;
        }
        
        const hostName = document.getElementById('host-name').value;
        const countdownDuration = parseInt(document.getElementById('countdown-duration').value);
        const useDefaultQuestions = document.getElementById('use-default-questions').checked;
        
        let questions = [];
        
        if (!useDefaultQuestions) {
            // Collect custom questions
            const questionItems = document.querySelectorAll('.question-item');
            questionItems.forEach(item => {
                const questionText = item.querySelector('input').value;
                const optionInputs = item.querySelectorAll('.options-container input');
                
                const options = [];
                optionInputs.forEach(input => {
                    if (input.value.trim()) {
                        options.push(input.value.trim());
                    }
                });
                
                if (questionText.trim() && options.length >= 2) {
                    questions.push({
                        text: questionText.trim(),
                        options: options
                    });
                }
            });
        }
        
        const requestBody = {
            hostName: hostName,
            countdownDuration: countdownDuration
        };
        
        if (!useDefaultQuestions && questions.length > 0) {
            requestBody.questions = questions;
        }
        
        // Check if user is authenticated
        if (!sessionState.auth.token) {
            showToast('Error', 'Authentication required. Please login with a host account first.');
            document.querySelector('#sidebar a[data-section="auth-section"]').click();
            return;
        }
        
        fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionState.auth.token}`
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create event');
            }
            return response.json();
        })
        .then(data => {
            // Update session state
            sessionState.eventCode = data.eventCode;
            sessionState.hostName = hostName;
            
            // Update UI
            updateSessionInfo();
            
            // Show success message
            showToast('Success', `Event created with code: ${data.eventCode}`);
        })
        .catch(error => {
            console.error('Error creating event:', error);
            showToast('Error', 'Failed to create event');
        });
    });
    
    // Get Event Details
    getEventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const eventCode = document.getElementById('event-code-details').value.trim();
        
        if (!eventCode) {
            showToast('Error', 'Please enter an event code');
            return;
        }
        
        fetch(`${API_BASE_URL}/events/${eventCode}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.details || data.message || 'Failed to get event details');
                });
            }
            return response.json();
        })
        .then(data => {
            // Display event details
            const eventDetailsContainer = document.getElementById('event-details-container');
            const eventDetails = document.getElementById('event-details');
            
            eventDetailsContainer.classList.remove('d-none');
            
            // Format the details
            let detailsHTML = `
                <p><strong>Event Code:</strong> ${data.eventCode}</p>
                <p><strong>Host Name:</strong> ${data.hostName}</p>
                <p><strong>Participant Count:</strong> ${data.participantCount}</p>
                <p><strong>Countdown Duration:</strong> ${formatTime(data.countdownDuration)}</p>
                <p><strong>Created At:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
                <p><strong>Is Active:</strong> ${data.isActive ? 'Yes' : 'No'}</p>
            `;
            
            if (data.startTime) {
                detailsHTML += `<p><strong>Start Time:</strong> ${new Date(data.startTime).toLocaleString()}</p>`;
            }
            
            detailsHTML += `<h6 class="mt-3">Questions:</h6><ol>`;
            
            data.questions.forEach(question => {
                detailsHTML += `<li><strong>${question.text}</strong><ul>`;
                
                question.options.forEach(option => {
                    detailsHTML += `<li>${option}</li>`;
                });
                
                detailsHTML += `</ul></li>`;
            });
            
            detailsHTML += `</ol>`;
            
            eventDetails.innerHTML = detailsHTML;
            
            // Store questions for later use
            sessionState.questions = data.questions;
        })
        .catch(error => {
            console.error('Error getting event details:', error);
            showToast('Error', error.message || 'Failed to get event details');
        });
    });
    
    // Start Event
    startEventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Check if user is authorized as host
        if (!checkHostAuthorization()) {
            return;
        }
        
        const eventCode = document.getElementById('event-code-start').value.trim();
        
        if (!eventCode) {
            showToast('Error', 'Please enter an event code');
            return;
        }
        
        // Check if user is authenticated
        if (!sessionState.auth.token) {
            showToast('Error', 'Authentication required. Please login with a host account first.');
            document.querySelector('#sidebar a[data-section="auth-section"]').click();
            return;
        }
        
        fetch(`${API_BASE_URL}/events/${eventCode}/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionState.auth.token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.details || data.message || 'Failed to start event');
                });
            }
            return response.json();
        })
        .then(data => {
            showToast('Success', 'Event started successfully');
            
            // If we have a socket connection, emit the start-countdown event
            if (sessionState.socket && sessionState.eventCode === eventCode) {
                const countdownDuration = document.getElementById('countdown-duration').value;
                sessionState.socket.emit('start-countdown', {
                    eventCode: eventCode,
                    duration: parseInt(countdownDuration)
                });
            }
        })
        .catch(error => {
            console.error('Error starting event:', error);
            showToast('Error', error.message || 'Failed to start event');
        });
    });
    
    // Join Event
    joinEventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Trim the event code to remove any leading/trailing spaces
        const eventCode = document.getElementById('event-code-join').value.trim();
        const displayName = document.getElementById('display-name').value.trim();
        
        if (!eventCode) {
            showToast('Error', 'Please enter an event code');
            return;
        }
        
        fetch(`${API_BASE_URL}/events/${eventCode}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                displayName: displayName
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.details || data.message || 'Failed to join event');
                });
            }
            return response.json();
        })
        .then(data => {
            // Update session state
            sessionState.eventCode = data.eventCode || eventCode;
            sessionState.participantId = data.anonymousId;
            sessionState.displayName = data.displayName;
            
            // Update UI
            updateSessionInfo();
            
            // Enable buttons that require participant ID
            document.getElementById('submit-outfit-btn').disabled = false;
            
            // Show success message
            showToast('Success', `Joined event as ${data.displayName}`);
            
            // Connect to socket
            connectToSocket();
            
            // Load questionnaire
            loadQuestionnaire(sessionState.eventCode);
        })
        .catch(error => {
            console.error('Error joining event:', error);
            showToast('Error', error.message || 'Failed to join event. Please check the event code and try again.');
        });
    });
    
    // Submit Questionnaire
    questionnaireForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!sessionState.eventCode || !sessionState.participantId) {
            showToast('Error', 'You must join an event first');
            return;
        }
        
        const responses = [];
        
        // Collect responses
        sessionState.questions.forEach((question, index) => {
            const responseElement = document.querySelector(`input[name="question-${index}"]:checked`);
            
            if (responseElement) {
                responses.push({
                    questionId: index,
                    answer: responseElement.value
                });
            }
        });
        
        // Check required questions (orientation and relationship preferences)
        const hasOrientation = responses.some(r => r.questionId === 0);
        const hasRelationshipPref = responses.some(r => r.questionId === 1);
        
        if (!hasOrientation || !hasRelationshipPref) {
            showToast('Error', 'Please answer the first two questions about orientation and relationship preferences');
            return;
        }
        
        // Allow other questions to be optional
        if (responses.length < 2) {
            showToast('Error', 'Please answer at least the orientation and relationship preference questions');
            return;
        }
        
        showToast('Info', `You're submitting ${responses.length} out of ${sessionState.questions.length} question responses`);
        
        // Store responses for later use
        sessionState.responses = responses;
        
        fetch(`${API_BASE_URL}/events/${sessionState.eventCode}/responses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                anonymousId: sessionState.participantId,
                responses: responses
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to submit responses');
            }
            return response.json();
        })
        .then(data => {
            showToast('Success', 'Responses submitted successfully');
        })
        .catch(error => {
            console.error('Error submitting responses:', error);
            showToast('Error', 'Failed to submit responses');
        });
    });
    
    // Submit Outfit
    outfitForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!sessionState.eventCode || !sessionState.participantId) {
            showToast('Error', 'You must join an event first');
            return;
        }
        
        const outfitDescription = document.getElementById('outfit-description').value;
        
        if (!outfitDescription.trim()) {
            showToast('Error', 'Please enter an outfit description');
            return;
        }
        
        // Create FormData object for file upload
        const formData = new FormData();
        formData.append('anonymousId', sessionState.participantId);
        formData.append('outfit', outfitDescription);
        
        // Check if an image was selected
        const outfitImageInput = document.getElementById('outfit-image');
        if (outfitImageInput.files && outfitImageInput.files[0]) {
            formData.append('outfitImage', outfitImageInput.files[0]);
        }
        
        fetch(`${API_BASE_URL}/events/${sessionState.eventCode}/outfit`, {
            method: 'POST',
            body: formData
            // Note: Don't set Content-Type header when sending FormData,
            // browser will set it automatically with the correct boundary
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to submit outfit');
            }
            return response.json();
        })
        .then(data => {
            showToast('Success', 'Outfit submitted successfully');
            
            // Store image URL if provided
            if (data.outfitImageUrl) {
                sessionState.outfitImageUrl = data.outfitImageUrl;
                
                // Show preview of the uploaded image
                const imagePreview = document.getElementById('outfit-image-preview');
                if (imagePreview) {
                    imagePreview.src = data.outfitImageUrl;
                    imagePreview.classList.remove('d-none');
                }
            }
        })
        .catch(error => {
            console.error('Error submitting outfit:', error);
            showToast('Error', 'Failed to submit outfit');
        });
    });
    
    // Load Outfits
    loadOutfitsBtn.addEventListener('click', function() {
        if (!sessionState.eventCode) {
            showToast('Error', 'You must join an event first');
            return;
        }
        
        // Fetch outfits from the API
        fetch(`${API_BASE_URL}/events/${sessionState.eventCode}/leaderboard`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load outfits');
            }
            return response.json();
        })
        .then(data => {
            const outfitsContainer = document.getElementById('outfits-container');
            const outfitsList = document.getElementById('outfits-list');
            
            outfitsContainer.classList.remove('d-none');
            outfitsList.innerHTML = '';
            
            // Filter to remove current user's outfit
            const outfitsToDisplay = data.filter(outfit => outfit.anonymousId !== sessionState.participantId);
            
            if (outfitsToDisplay.length === 0) {
                outfitsList.innerHTML = '<div class="col-12"><div class="alert alert-info">No outfits available to vote on yet.</div></div>';
                return;
            }
            
            outfitsToDisplay.forEach(outfit => {
                const outfitCard = document.createElement('div');
                outfitCard.className = 'col-md-4 mb-3';
                
                let outfitImageHtml = '';
                if (outfit.outfitImageUrl) {
                    outfitImageHtml = `
                        <div class="outfit-image-container mb-3">
                            <img src="${outfit.outfitImageUrl}" class="img-fluid outfit-image" alt="Outfit image" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                        </div>
                    `;
                }
                
                outfitCard.innerHTML = `
                    <div class="card outfit-card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${outfit.anonymousId}</h5>
                            ${outfitImageHtml}
                            <p class="card-text">${outfit.outfit}</p>
                            <div class="star-rating" data-participant="${outfit.anonymousId}">
                                <span class="star" data-rating="1">★</span>
                                <span class="star" data-rating="2">★</span>
                                <span class="star" data-rating="3">★</span>
                                <span class="star" data-rating="4">★</span>
                                <span class="star" data-rating="5">★</span>
                            </div>
                        </div>
                    </div>
                `;
                
                outfitsList.appendChild(outfitCard);
            });
            
            // Add event listeners to stars
            document.querySelectorAll('.star-rating .star').forEach(star => {
                star.addEventListener('click', function() {
                    const rating = parseInt(this.getAttribute('data-rating'));
                    const participantId = this.parentElement.getAttribute('data-participant');
                    
                    // Update UI
                    const stars = this.parentElement.querySelectorAll('.star');
                    stars.forEach(s => {
                        if (parseInt(s.getAttribute('data-rating')) <= rating) {
                            s.classList.add('active');
                            s.classList.remove('inactive');
                        } else {
                            s.classList.add('inactive');
                            s.classList.remove('active');
                        }
                    });
                    
                    // Submit vote
                    submitVote(participantId, rating);
                });
            });
        })
        .catch(error => {
            console.error('Error loading outfits:', error);
            showToast('Error', 'Failed to load outfits');
        });
    });
    
    // Load Leaderboard
    loadLeaderboardBtn.addEventListener('click', function() {
        if (!sessionState.eventCode) {
            showToast('Error', 'You must join an event first');
            return;
        }
        
        fetch(`${API_BASE_URL}/events/${sessionState.eventCode}/leaderboard`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load leaderboard');
            }
            return response.json();
        })
        .then(data => {
            const leaderboardContainer = document.getElementById('leaderboard-container');
            const leaderboardBody = document.getElementById('leaderboard-body');
            
            leaderboardContainer.classList.remove('d-none');
            leaderboardBody.innerHTML = '';
            
            // Sort by average score (highest first)
            data.sort((a, b) => b.averageScore - a.averageScore);
            
            data.forEach((entry, index) => {
                const row = document.createElement('tr');
                
                // Create outfit cell content with conditional image
                let outfitCell = `<td>${entry.outfit}`;
                if (entry.outfitImageUrl) {
                    outfitCell += `<br><a href="${entry.outfitImageUrl}" target="_blank" class="mt-2 d-block">
                        <img src="${entry.outfitImageUrl}" alt="Outfit thumbnail" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
                    </a>`;
                }
                outfitCell += `</td>`;
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${entry.anonymousId}</td>
                    ${outfitCell}
                    <td>${entry.averageScore.toFixed(1)}</td>
                    <td>${entry.voteCount}</td>
                `;
                
                leaderboardBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading leaderboard:', error);
            showToast('Error', 'Failed to load leaderboard');
        });
    });
    
    // Trigger Matchmaking
    triggerMatchmakingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Check if user is authorized as host
        if (!checkHostAuthorization()) {
            return;
        }
        
        const eventCode = document.getElementById('event-code-matchmaking').value.trim();
        const forceRematch = document.getElementById('force-rematch-checkbox').checked;
        
        if (!eventCode) {
            showToast('Error', 'Please enter an event code');
            return;
        }
        
        // Check if user is authenticated
        if (!sessionState.auth.token) {
            showToast('Error', 'Authentication required. Please login with a host account first.');
            document.querySelector('#sidebar a[data-section="auth-section"]').click();
            return;
        }
        
        fetch(`${API_BASE_URL}/events/${eventCode}/reveal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionState.auth.token}`
            },
            body: JSON.stringify({
                force: forceRematch
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to trigger matchmaking');
                });
            }
            return response.json();
        })
        .then(data => {
            showToast('Success', `Matchmaking completed with ${data.matchCount} matches`);
            
            // If we have a socket connection, emit the trigger-match-reveal event
            if (sessionState.socket && sessionState.eventCode === eventCode) {
                sessionState.socket.emit('trigger-match-reveal', eventCode);
            }
            
            // Enable view match button if we're a participant
            if (sessionState.participantId) {
                document.getElementById('view-match-btn').disabled = false;
            }
        })
        .catch(error => {
            console.error('Error triggering matchmaking:', error);
            showToast('Error', error.message || 'Failed to trigger matchmaking');
        });
    });
    
    // View Match
    viewMatchBtn.addEventListener('click', function() {
        if (!sessionState.eventCode || !sessionState.participantId) {
            showToast('Error', 'You must join an event first');
            return;
        }
        
        fetch(`${API_BASE_URL}/events/${sessionState.eventCode}/matches?anonymousId=${sessionState.participantId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to get match');
            }
            return response.json();
        })
        .then(data => {
            const matchContainer = document.getElementById('match-container');
            const matchDetails = document.getElementById('match-details');
            
            matchContainer.classList.remove('d-none');
            
            if (data.matched) {
                // Store match ID for chat
                sessionState.matchParticipantId = data.matchParticipantId;
                
                // Create a consistent match ID by sorting the participant IDs
                // This ensures both participants get the same chat room regardless of who joins first
                const participants = [sessionState.participantId, data.matchParticipantId].sort();
                sessionState.matchId = participants.join('-');
                
                // Enable follow-up buttons
                document.getElementById('submit-followup-btn').disabled = false;
                document.getElementById('check-match-interest-btn').disabled = false;
                
                // Format match details
                let detailsHTML = `
                    <p><strong>Match:</strong> ${data.displayName}</p>
                    <p><strong>Compatibility Score:</strong> ${data.compatibilityScore}</p>
                `;
                
                if (data.isWildCard) {
                    detailsHTML += `<p><strong>Wild Card Match:</strong> Yes</p>`;
                }
                
                if (data.outfit) {
                    detailsHTML += `<p><strong>Outfit:</strong> ${data.outfit}</p>`;
                }
                
                detailsHTML += `
                    <button type="button" class="btn btn-primary mt-3" id="open-chat-btn">Open Chat</button>
                `;
                
                matchDetails.innerHTML = detailsHTML;
                
                // Add event listener to open chat button
                document.getElementById('open-chat-btn').addEventListener('click', function() {
                    // Switch to real-time section
                    document.querySelector('#sidebar a[data-section="realtime-section"]').click();
                    
                    // Show chat
                    document.getElementById('chat-placeholder').classList.add('d-none');
                    document.getElementById('chat-container').classList.remove('d-none');
                    
                    // Join chat room
                    if (sessionState.socket) {
                        sessionState.socket.emit('join-chat', {
                            eventCode: sessionState.eventCode,
                            matchId: sessionState.matchId,
                            participantId: sessionState.participantId,
                            displayName: sessionState.displayName || sessionState.participantId
                        });
                    }
                });
            } else {
                matchDetails.innerHTML = `
                    <div class="alert alert-info">
                        <p>${data.message}</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error getting match:', error);
            showToast('Error', 'Failed to get match');
        });
    });
    
    // Submit Follow-Up
    followupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!sessionState.eventCode || !sessionState.participantId || !sessionState.matchParticipantId) {
            showToast('Error', 'You must join an event and have a match first');
            return;
        }
        
        const reconnect = document.getElementById('reconnect-checkbox').checked;
        const contactInfo = document.getElementById('contact-info').value;
        
        fetch(`${API_BASE_URL}/events/${sessionState.eventCode}/followup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                participantId: sessionState.participantId,
                reconnect: reconnect,
                contactInfo: reconnect ? contactInfo : null
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to submit follow-up');
            }
            return response.json();
        })
        .then(data => {
            showToast('Success', 'Follow-up submitted successfully');
        })
        .catch(error => {
            console.error('Error submitting follow-up:', error);
            showToast('Error', 'Failed to submit follow-up');
        });
    });
    
    // Check Match Interest
    checkMatchInterestBtn.addEventListener('click', function() {
        if (!sessionState.eventCode || !sessionState.participantId || !sessionState.matchParticipantId) {
            showToast('Error', 'You must join an event and have a match first');
            return;
        }
        
        fetch(`${API_BASE_URL}/events/${sessionState.eventCode}/followup/match?participantId=${sessionState.participantId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to check match interest');
            }
            return response.json();
        })
        .then(data => {
            const matchInterestContainer = document.getElementById('match-interest-container');
            const matchInterestDetails = document.getElementById('match-interest-details');
            
            matchInterestContainer.classList.remove('d-none');
            
            if (data.mutualInterest) {
                matchInterestDetails.innerHTML = `
                    <div class="alert alert-success">
                        <p><strong>Good news!</strong> Your match also wants to reconnect.</p>
                        <p><strong>Contact Info:</strong> ${data.matchContactInfo || 'Not provided'}</p>
                    </div>
                `;
            } else {
                matchInterestDetails.innerHTML = `
                    <div class="alert alert-info">
                        <p>Your match has not indicated interest in reconnecting yet, or you both have different preferences.</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error checking match interest:', error);
            showToast('Error', 'Failed to check match interest');
        });
    });
    
    // Get Follow-Up Stats
    followupStatsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Check if user is authorized as host
        if (!checkHostAuthorization()) {
            return;
        }
        
        const eventCode = document.getElementById('event-code-stats').value;
        
        fetch(`${API_BASE_URL}/events/${eventCode}/followup/stats`, {
            headers: {
                'Authorization': `Bearer ${sessionState.auth.token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to get follow-up stats');
            }
            return response.json();
        })
        .then(data => {
            const followupStatsContainer = document.getElementById('followup-stats-container');
            const followupStats = document.getElementById('followup-stats');
            
            followupStatsContainer.classList.remove('d-none');
            
            followupStats.innerHTML = `
                <p><strong>Total Participants:</strong> ${data.totalParticipants}</p>
                <p><strong>Total Matches:</strong> ${data.totalMatches}</p>
                <p><strong>Total Follow-Ups:</strong> ${data.totalFollowUps}</p>
                <p><strong>Want to Reconnect:</strong> ${data.wantToReconnect} (${data.reconnectPercentage})</p>
                <p><strong>Mutual Interest:</strong> ${data.mutualInterestCount} (${data.mutualInterestPercentage})</p>
            `;
        })
        .catch(error => {
            console.error('Error getting follow-up stats:', error);
            showToast('Error', 'Failed to get follow-up stats');
        });
    });
    
    // Send Chat Message
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!sessionState.socket || !sessionState.eventCode || !sessionState.participantId || !sessionState.matchId) {
            console.log('Chat error - missing data:', {
                hasSocket: !!sessionState.socket,
                eventCode: sessionState.eventCode,
                participantId: sessionState.participantId,
                matchId: sessionState.matchId
            });
            showToast('Error', 'You must join an event and have a match first');
            return;
        }
        
        const messageInput = document.getElementById('chat-input');
        const message = messageInput.value.trim();
        
        if (!message) {
            return;
        }
        
        console.log('Sending message via socket:', {
            eventCode: sessionState.eventCode,
            matchId: sessionState.matchId,
            senderId: sessionState.participantId
        });
        
        // Send message via socket
        sessionState.socket.emit('send-message', {
            eventCode: sessionState.eventCode,
            matchId: sessionState.matchId,
            senderId: sessionState.participantId,
            content: message
        });
        
        // Add message to chat right away (optimistic UI update)
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message sent';
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const displayName = sessionState.displayName || sessionState.participantId;
        
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-info small text-end">${timestamp}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Clear input
        messageInput.value = '';
    });
    
    // QR Code Generator
    generateQRForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const eventCode = document.getElementById('event-code-qr').value.trim();
        
        if (!eventCode) {
            showToast('Error', 'Please enter an event code');
            return;
        }
        
        fetch(`${API_BASE_URL}/events/${eventCode}/qrcode`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to generate QR code');
                });
            }
            return response.json();
        })
        .then(data => {
            // Display QR code
            const qrcodeContainer = document.getElementById('qrcode-container');
            const qrcodeImage = document.getElementById('qrcode-image');
            const qrcodeEventCode = document.getElementById('qrcode-event-code');
            const qrcodeJoinUrl = document.getElementById('qrcode-join-url');
            
            qrcodeContainer.classList.remove('d-none');
            qrcodeImage.src = data.qrCode;
            qrcodeEventCode.textContent = data.eventCode;
            qrcodeJoinUrl.href = data.joinUrl;
            qrcodeJoinUrl.textContent = data.joinUrl;
            
            showToast('Success', 'QR code generated successfully');
        })
        .catch(error => {
            console.error('Error generating QR code:', error);
            showToast('Error', error.message || 'Failed to generate QR code');
        });
    });
    
    // QR Code Scanner
    let html5QrCode;
    
    startScannerBtn.addEventListener('click', function() {
        const scannerContainer = document.getElementById('scanner-container');
        scannerContainer.classList.remove('d-none');
        this.classList.add('d-none');
        stopScannerBtn.classList.remove('d-none');
        
        html5QrCode = new Html5Qrcode("qr-reader");
        const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        html5QrCode.start(
            { facingMode: "environment" },
            qrConfig,
            onScanSuccess,
            onScanFailure
        );
    });
    
    stopScannerBtn.addEventListener('click', function() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                const scannerContainer = document.getElementById('scanner-container');
                scannerContainer.classList.add('d-none');
                this.classList.add('d-none');
                startScannerBtn.classList.remove('d-none');
            });
        }
    });
    
    function onScanSuccess(decodedText, decodedResult) {
        // Stop scanning
        html5QrCode.stop();
        
        // Display results
        const resultsElement = document.getElementById('qr-reader-results');
        resultsElement.innerHTML = `<div class="alert alert-success">
            <p><strong>QR Code Scanned Successfully!</strong></p>
            <p>Detected URL: ${decodedText}</p>
        </div>`;
        
        stopScannerBtn.classList.add('d-none');
        startScannerBtn.classList.remove('d-none');
        
        // Extract event code from URL
        try {
            const url = new URL(decodedText);
            const pathParts = url.pathname.split('/');
            const eventCode = pathParts[pathParts.length - 1];
            
            if (eventCode) {
                // Automatically fill in the join form
                document.getElementById('event-code-join').value = eventCode;
                
                // Switch to participant section
                document.querySelector('#sidebar a[data-section="participant-section"]').click();
                
                showToast('Success', `Event code ${eventCode} detected. Ready to join!`);
            }
        } catch (error) {
            console.error('Error parsing QR code URL:', error);
        }
    }
    
    function onScanFailure(error) {
        // Handle scan failure silently - no need to show errors for each frame
        console.debug(`QR code scanning error: ${error}`);
    }
    
    // Register as Host button
    const registerAsHostBtn = document.getElementById('register-as-host-btn');
    const registerAsHostCheckbox = document.getElementById('register-as-host-checkbox');
    const hostRegistrationBanner = document.getElementById('host-registration-banner');
    const authStatusBanner = document.getElementById('auth-status-banner');
    const bannerUsername = document.getElementById('banner-username');
    const bannerUserRole = document.getElementById('banner-user-role');
    const bannerLogoutBtn = document.getElementById('banner-logout-btn');
    const goToHostPanelBtn = document.getElementById('go-to-host-panel');
    
    // Register as Host button click
    registerAsHostBtn.addEventListener('click', function() {
        // Go to auth section and select register tab
        document.querySelector('#sidebar a[data-section="auth-section"]').click();
        document.getElementById('register-tab').click();
        registerAsHostCheckbox.checked = true;
        
        // Scroll to the form
        document.getElementById('register-form').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Go to host panel button click
    goToHostPanelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('#sidebar a[data-section="host-section"]').click();
    });
    
    // Banner logout button
    bannerLogoutBtn.addEventListener('click', logoutUser);
    
    // Auth form event listeners
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        loginUser(username, password);
    });
    
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const asHost = document.getElementById('register-as-host-checkbox').checked;
        
        if (password !== confirmPassword) {
            showToast('error', 'Passwords do not match!');
            return;
        }
        
        registerUser(username, email, password, asHost);
    });
    
    document.getElementById('logout-btn').addEventListener('click', logoutUser);
    
    // Check authentication status on page load
    checkAuthStatus();
    
    // Initial UI updates
    updateAuthUI();
});

// Helper Functions

// Connect to Socket.IO
function connectToSocket() {
    if (sessionState.socket) {
        console.log('Disconnecting existing socket connection');
        sessionState.socket.disconnect();
    }
    
    console.log('Connecting to socket server at:', SOCKET_URL);
    sessionState.socket = io(SOCKET_URL);
    
    sessionState.socket.on('connect', () => {
        console.log('Socket connected successfully, socket id:', sessionState.socket.id);
        
        if (sessionState.eventCode) {
            // Join event room
            console.log('Joining event room:', sessionState.eventCode);
            sessionState.socket.emit('join-event', sessionState.eventCode);
            
            // Update lobby info
            document.getElementById('lobby-event-code').textContent = sessionState.eventCode;
            document.getElementById('lobby-host-name').textContent = sessionState.hostName || '-';
            
            // If we already have a match, automatically join the chat room
            if (sessionState.matchId && sessionState.matchParticipantId) {
                console.log('Auto-joining chat room for match:', sessionState.matchId);
                sessionState.socket.emit('join-chat', {
                    eventCode: sessionState.eventCode,
                    matchId: sessionState.matchId,
                    participantId: sessionState.participantId,
                    displayName: sessionState.displayName || sessionState.participantId
                });
                
                // Show chat container
                document.getElementById('chat-placeholder').classList.add('d-none');
                document.getElementById('chat-container').classList.remove('d-none');
            }
        }
    });
    
    sessionState.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        showToast('Connection Error', 'Failed to connect to the chat server. Please try again.');
    });
    
    // Lobby events
    sessionState.socket.on('participant-update', (data) => {
        document.getElementById('lobby-participant-count').textContent = data.count;
    });
    
    sessionState.socket.on('countdown-update', (data) => {
        const countdownDisplay = document.getElementById('countdown-display');
        const countdownStatus = document.getElementById('countdown-status');
        
        countdownDisplay.textContent = formatTime(data.remainingTime);
        countdownStatus.textContent = 'Countdown in progress';
    });
    
    sessionState.socket.on('countdown-complete', () => {
        const countdownDisplay = document.getElementById('countdown-display');
        const countdownStatus = document.getElementById('countdown-status');
        
        countdownDisplay.textContent = '00:00';
        countdownStatus.textContent = 'Countdown complete';
    });
    
    sessionState.socket.on('leaderboard-update', (data) => {
        // Update leaderboard if visible
        if (!document.getElementById('leaderboard-container').classList.contains('d-none')) {
            // Trigger leaderboard refresh
            document.getElementById('load-leaderboard-btn').click();
        }
    });
    
    sessionState.socket.on('match-reveal', () => {
        showToast('Match Reveal', 'Matches have been revealed!');
        
        // Enable view match button
        document.getElementById('view-match-btn').disabled = false;
    });
    
    // Chat events
    sessionState.socket.on('chat-history', (data) => {
        console.log('Received chat history:', data.messages.length, 'messages');
        const chatMessages = document.getElementById('chat-messages');
        
        // Clear existing messages
        chatMessages.innerHTML = '';
        
        // Add messages
        data.messages.forEach(message => {
            addChatMessage(message);
        });
    });
    
    sessionState.socket.on('new-message', (message) => {
        console.log('Received new message:', message);
        addChatMessage(message);
    });
    
    sessionState.socket.on('chat-participant-joined', (data) => {
        console.log('Participant joined chat:', data);
        const chatMessages = document.getElementById('chat-messages');
        
        const systemMessage = document.createElement('div');
        systemMessage.className = 'text-center text-muted small my-2';
        systemMessage.textContent = `${data.displayName || data.participantId} joined the chat`;
        
        chatMessages.appendChild(systemMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    
    sessionState.socket.on('chat-participant-left', (data) => {
        console.log('Participant left chat:', data);
        const chatMessages = document.getElementById('chat-messages');
        
        const systemMessage = document.createElement('div');
        systemMessage.className = 'text-center text-muted small my-2';
        systemMessage.textContent = `${data.displayName || data.participantId} left the chat`;
        
        chatMessages.appendChild(systemMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// Load questionnaire
function loadQuestionnaire(eventCode) {
    fetch(`${API_BASE_URL}/events/${eventCode}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to get event details');
        }
        return response.json();
    })
    .then(data => {
        // Store questions
        sessionState.questions = data.questions;
        
        // Update host name if not set
        if (!sessionState.hostName) {
            sessionState.hostName = data.hostName;
            updateSessionInfo();
        }
        
        // Display questionnaire
        const questionnaireContainer = document.getElementById('questionnaire-container');
        const questionnairePlaceholder = document.getElementById('questionnaire-placeholder');
        const questionsContainer = document.getElementById('questions-container');
        
        questionnaireContainer.classList.remove('d-none');
        questionnairePlaceholder.classList.add('d-none');
        
        questionsContainer.innerHTML = '';
        
        // Add submit instructions
        const instructionsDiv = document.createElement('div');
        instructionsDiv.className = 'alert alert-info mt-3';
        instructionsDiv.innerHTML = `
            <strong>Important:</strong> Please answer at least the first two questions about orientation and relationship preferences. 
            These are critical for finding your best matches!
        `;
        questionsContainer.appendChild(instructionsDiv);
        
        // Add section headers
        let currentCategory = "";
        
        data.questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'mb-4';
            
            // Add category headers based on index
            let categoryHeader = '';
            if (index === 0) {
                categoryHeader = '<h4 class="mt-4 mb-3 text-primary">Sexual Orientation</h4>';
            } else if (index === 1) {
                categoryHeader = '<h4 class="mt-4 mb-3 text-primary">Relationship Preferences</h4>';
            } else if (index === 2) {
                categoryHeader = '<h4 class="mt-4 mb-3 text-primary">Personality & Compatibility</h4>';
            } else if (index === 6) {
                categoryHeader = '<h4 class="mt-4 mb-3 text-primary">Flirty & Romantic Preferences</h4>';
            } else if (index === 9) {
                categoryHeader = '<h4 class="mt-4 mb-3 text-primary">Party & Social Vibes</h4>';
            } else if (index === 12) {
                categoryHeader = '<h4 class="mt-4 mb-3 text-primary">Icebreakers & Fun</h4>';
            } else if (index === 13) {
                categoryHeader = '<h4 class="mt-4 mb-3 text-primary">Deep Personality & Self-Reflection</h4>';
            }
            
            questionDiv.innerHTML = `
                ${categoryHeader}
                <h5>${index + 1}. ${question.text}</h5>
                <div class="question-options">
                    ${question.options.map((option, optionIndex) => `
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="question-${index}" id="question-${index}-option-${optionIndex}" value="${option}" ${index < 2 ? 'required' : ''}>
                            <label class="form-check-label" for="question-${index}-option-${optionIndex}">
                                ${option}
                            </label>
                        </div>
                    `).join('')}
                </div>
            `;
            
            questionsContainer.appendChild(questionDiv);
        });
    })
    .catch(error => {
        console.error('Error loading questionnaire:', error);
        showToast('Error', 'Failed to load questionnaire');
    });
}

// Submit vote
function submitVote(outfitOwnerId, score) {
    if (!sessionState.eventCode || !sessionState.participantId) {
        showToast('Error', 'You must join an event first');
        return;
    }
    
    fetch(`${API_BASE_URL}/events/${sessionState.eventCode}/vote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            voterId: sessionState.participantId,
            outfitOwnerId: outfitOwnerId,
            score: score
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to submit vote');
        }
        return response.json();
    })
    .then(data => {
        showToast('Success', 'Vote submitted successfully');
        
        // If we have a socket connection, emit the update-leaderboard event
        if (sessionState.socket) {
            sessionState.socket.emit('update-leaderboard', {
                eventCode: sessionState.eventCode
            });
        }
    })
    .catch(error => {
        console.error('Error submitting vote:', error);
        showToast('Error', 'Failed to submit vote');
    });
}

// Add chat message
function addChatMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.senderId === sessionState.participantId ? 'sent' : 'received'}`;
    
    const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderName = message.displayName || message.senderId;
    
    messageDiv.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-info small text-end">
            ${message.senderId !== sessionState.participantId ? senderName + ' • ' : ''}${timestamp}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Update session info
function updateSessionInfo() {
    document.getElementById('current-event-code').textContent = sessionState.eventCode || 'None';
    document.getElementById('current-host-name').textContent = sessionState.hostName || 'None';
    document.getElementById('current-participant-id').textContent = sessionState.displayName || sessionState.participantId || 'None';
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Show toast notification
function showToast(title, message) {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Authentication functions
function checkAuthStatus() {
    if (sessionState.auth.token) {
        // User has a token, verify if it's valid by fetching current user
        fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${sessionState.auth.token}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                // Token invalid, clear it
                logoutUser();
                throw new Error('Session expired. Please login again.');
            }
        })
        .then(userData => {
            // Valid token, update user data
            sessionState.auth.user = userData;
            updateAuthUI();
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            showToast('error', error.message);
        });
    } else {
        // No token, user is not logged in
        updateAuthUI();
    }
}

function updateAuthUI() {
    const loggedOutView = document.getElementById('logged-out-view');
    const loggedInView = document.getElementById('logged-in-view');
    const hostRegistrationBanner = document.getElementById('host-registration-banner');
    const authStatusBanner = document.getElementById('auth-status-banner');
    
    if (sessionState.auth.user) {
        // User is logged in
        sessionState.auth.isAuthenticated = true;
        loggedOutView.classList.add('d-none');
        loggedInView.classList.remove('d-none');
        
        // Hide registration banner and show status banner
        hostRegistrationBanner.classList.add('d-none');
        authStatusBanner.classList.remove('d-none');
        
        // Update user info display
        document.getElementById('current-username').textContent = sessionState.auth.user.username;
        document.getElementById('current-role').textContent = sessionState.auth.user.role;
        document.getElementById('banner-username').textContent = sessionState.auth.user.username;
        document.getElementById('banner-user-role').textContent = sessionState.auth.user.role;
        
        // Set isHost flag
        sessionState.auth.isHost = (sessionState.auth.user.role === 'host' || sessionState.auth.user.role === 'admin');
        
        // Enable host features if the user has the host or admin role
        if (sessionState.auth.isHost) {
            document.querySelectorAll('.host-only').forEach(el => {
                el.removeAttribute('disabled');
                el.classList.remove('disabled');
            });
            
            // Show a toast notification if they're not already in the host section
            const activeSection = document.querySelector('.content-section.active');
            if (activeSection && activeSection.id !== 'host-section') {
                showToast('info', 'You are logged in as a host. Host features are now available.');
            }
            
            // If host/admin section isn't visible, highlight it
            const hostTab = document.querySelector('#sidebar a[data-section="host-section"]');
            if (hostTab) {
                hostTab.classList.add('host-tab-highlight');
            }
        } else {
            // User is logged in but not a host, disable host features
            document.querySelectorAll('.host-only').forEach(el => {
                el.setAttribute('disabled', 'disabled');
                el.classList.add('disabled');
            });
            showToast('info', 'You are logged in but need host privileges for some features.');
        }
    } else {
        // User is not logged in
        sessionState.auth.isAuthenticated = false;
        sessionState.auth.isHost = false;
        loggedOutView.classList.remove('d-none');
        loggedInView.classList.add('d-none');
        
        // Show registration banner and hide status banner
        hostRegistrationBanner.classList.remove('d-none');
        authStatusBanner.classList.add('d-none');
        
        // Disable host features
        document.querySelectorAll('.host-only').forEach(el => {
            el.setAttribute('disabled', 'disabled');
            el.classList.add('disabled');
        });
        
        // Remove any host tab highlighting
        const hostTab = document.querySelector('#sidebar a[data-section="host-section"]');
        if (hostTab) {
            hostTab.classList.remove('host-tab-highlight');
        }
    }
}

function loginUser(username, password) {
    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.json().then(err => {
                throw new Error(err.message || 'Login failed');
            });
        }
    })
    .then(data => {
        // Store token and user data
        sessionState.auth.token = data.token;
        sessionState.auth.user = data.user;
        
        // Save token to localStorage for persistence
        localStorage.setItem('authToken', data.token);
        
        // Update UI
        updateAuthUI();
        showToast('success', 'Login successful!');
        
        // Reset login form
        document.getElementById('login-form').reset();
        
        // If user is a host, redirect to host section
        if (sessionState.auth.isHost) {
            document.querySelector('#sidebar a[data-section="host-section"]').click();
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showToast('error', error.message);
    });
}

function registerUser(username, email, password, asHost = false) {
    // First, register the user
    fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            username, 
            email, 
            password,
            role: asHost ? 'host' : 'user' // Try to set role directly, although this might be restricted
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.json().then(err => {
                throw new Error(err.message || 'Registration failed');
            });
        }
    })
    .then(data => {
        // If user wants to be a host but the API doesn't support role in registration
        // We can auto-login the user and then handle host role separately
        sessionState.auth.token = data.token;
        sessionState.auth.user = data.user;
        
        // Save token to localStorage
        localStorage.setItem('authToken', data.token);
        
        if (asHost && data.user.role !== 'host') {
            showToast('info', 'Account created! Requesting host privileges...');
            // Admin would need to approve the host role, show appropriate message
            showToast('info', 'Host privileges require admin approval. An admin will review your request.');
        } else {
            showToast('success', 'Registration successful!');
        }
        
        // Update UI
        updateAuthUI();
        
        // Reset register form
        document.getElementById('register-form').reset();
        
        // If user is a host, redirect to host section
        if (sessionState.auth.isHost) {
            document.querySelector('#sidebar a[data-section="host-section"]').click();
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showToast('error', error.message);
    });
}

function logoutUser() {
    // Clear auth data
    sessionState.auth.token = null;
    sessionState.auth.user = null;
    sessionState.auth.isHost = false;
    sessionState.auth.isAuthenticated = false;
    localStorage.removeItem('authToken');
    
    // Update UI
    updateAuthUI();
    showToast('info', 'You have been logged out.');
}

// Helper function to check if user is authorized for host actions
function checkHostAuthorization() {
    if (!sessionState.auth.isAuthenticated) {
        showToast('error', 'You must be logged in to perform this action');
        document.querySelector('#sidebar a[data-section="auth-section"]').click();
        return false;
    }
    
    if (!sessionState.auth.isHost) {
        showToast('error', 'This action requires host privileges');
        return false;
    }
    
    return true;
}
