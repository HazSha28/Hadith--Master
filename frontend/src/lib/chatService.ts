import { z } from 'zod';

// Message metadata schema
export const MessageMetadataSchema = z.object({
  responder: z.enum(['AI', 'ADMIN']),
  confidence: z.enum(['high', 'medium', 'low']),
  escalation: z.boolean()
});

export type MessageMetadata = z.infer<typeof MessageMetadataSchema>;

// Chat message schema
export const ChatMessageSchema = z.object({
  id: z.string(),
  text: z.string(),
  sender: z.enum(['user', 'ai', 'admin']),
  timestamp: z.date(),
  metadata: MessageMetadataSchema,
  isTyping: z.boolean().optional()
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Escalation reasons
export const ESCALATION_REASONS = {
  FATWA_REQUEST: 'User requested religious legal guidance',
  ADMIN_REQUEST: 'User explicitly requested admin support',
  SENSITIVE_TOPIC: 'Sensitive religious topic requiring scholarly guidance',
  TECHNICAL_SUPPORT: 'Technical support required',
  EMOTIONAL_SUPPORT: 'Emotional support needed',
  DISPUTE_AUTHENTICITY: 'User disputes hadith authenticity',
  CONFUSION_AFTER_AI: 'User confused after AI responses',
  PAYMENT_ISSUE: 'Payment or subscription issue',
  BUG_REPORT: 'Bug report or system error'
} as const;

// AI response categories
export const AI_RESPONSE_CATEGORIES = {
  HADITH_EXPLANATION: 'HADITH_EXPLANATION',
  APP_GUIDANCE: 'APP_GUIDANCE',
  GENERAL_ISLAMIC: 'GENERAL_ISLAMIC',
  TECHNICAL_HELP: 'TECHNICAL_HELP',
  ESCALATION: 'ESCALATION',
  CLARIFICATION: 'CLARIFICATION'
} as const;

// Chat service class
export class ChatService {
  private static instance: ChatService;
  private escalationHistory: Map<string, string[]> = new Map();
  private responseCache: Map<string, ChatMessage> = new Map();

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Check if message requires escalation
  requiresEscalation(message: string, userId: string): { required: boolean; reason: keyof typeof ESCALATION_REASONS } {
    const lowerMessage = message.toLowerCase();
    
    // Explicit admin requests
    if (lowerMessage.includes('admin') || lowerMessage.includes('human support') || lowerMessage.includes('talk to human')) {
      return { required: true, reason: 'ADMIN_REQUEST' };
    }

    // Fatwa and legal requests
    if (lowerMessage.includes('fatwa') || lowerMessage.includes('legal ruling') || lowerMessage.includes('islamic law')) {
      return { required: true, reason: 'FATWA_REQUEST' };
    }

    // Sensitive topics
    const sensitiveTopics = [
      'divorce', 'marriage issues', 'inheritance division', 'criminal law',
      'political islam', 'sectarian', 'controversial', 'gender issues',
      'modern controversies', 'scholarly debate'
    ];
    
    if (sensitiveTopics.some(topic => lowerMessage.includes(topic))) {
      return { required: true, reason: 'SENSITIVE_TOPIC' };
    }

    // Technical issues
    if (lowerMessage.includes('payment') || lowerMessage.includes('subscription') || 
        lowerMessage.includes('billing') || lowerMessage.includes('premium')) {
      return { required: true, reason: 'PAYMENT_ISSUE' };
    }

    if (lowerMessage.includes('bug') || lowerMessage.includes('error') || 
        lowerMessage.includes('login issue') || lowerMessage.includes('account problem')) {
      return { required: true, reason: 'TECHNICAL_SUPPORT' };
    }

    // Authenticity disputes
    if (lowerMessage.includes('authentic') && lowerMessage.includes('dispute') ||
        lowerMessage.includes('doubt') && lowerMessage.includes('hadith')) {
      return { required: true, reason: 'DISPUTE_AUTHENTICITY' };
    }

    // Emotional indicators
    const emotionalWords = ['confused', 'frustrated', 'worried', 'concerned', 'upset', 'distressed'];
    if (emotionalWords.some(word => lowerMessage.includes(word))) {
      return { required: true, reason: 'EMOTIONAL_SUPPORT' };
    }

    // Check escalation history (if user has been escalated before for similar topics)
    const userEscalations = this.escalationHistory.get(userId) || [];
    if (userEscalations.length >= 2) {
      return { required: true, reason: 'CONFUSION_AFTER_AI' };
    }

    return { required: false, reason: 'ADMIN_REQUEST' }; // Default
  }

  // Generate AI response based on message category
  async generateAIResponse(message: string, userId: string): Promise<ChatMessage> {
    // Check cache first
    const cacheKey = `${message.toLowerCase().trim()}`;
    if (this.responseCache.has(cacheKey)) {
      return { ...this.responseCache.get(cacheKey)!, id: `ai-${Date.now()}`, timestamp: new Date() };
    }

    const category = this.categorizeMessage(message);
    let responseText = '';
    let confidence: 'high' | 'medium' | 'low' = 'high';
    let escalation = false;

    switch (category) {
      case 'HADITH_EXPLANATION':
        responseText = this.generateHadithResponse(message);
        confidence = 'high';
        break;

      case 'APP_GUIDANCE':
        responseText = this.generateAppGuidance(message);
        confidence = 'high';
        break;

      case 'GENERAL_ISLAMIC':
        responseText = this.generateGeneralIslamicResponse(message);
        confidence = 'medium';
        break;

      case 'TECHNICAL_HELP':
        responseText = this.generateTechnicalResponse(message);
        confidence = 'medium';
        escalation = true;
        break;

      case 'ESCALATION':
        responseText = "This requires admin support. I'm connecting you with our team now.";
        confidence = 'high';
        escalation = true;
        break;

      default:
        responseText = this.generateClarificationResponse(message);
        confidence = 'medium';
    }

    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      text: responseText,
      sender: 'ai',
      timestamp: new Date(),
      metadata: {
        responder: 'AI',
        confidence,
        escalation
      }
    };

    // Cache the response
    this.responseCache.set(cacheKey, aiMessage);

    return aiMessage;
  }

  // Categorize user message
  private categorizeMessage(message: string): keyof typeof AI_RESPONSE_CATEGORIES {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hadith') || lowerMessage.includes('narrator') || 
        lowerMessage.includes('bukhari') || lowerMessage.includes('muslim')) {
      return 'HADITH_EXPLANATION';
    }

    if (lowerMessage.includes('search') || lowerMessage.includes('find') || 
        lowerMessage.includes('how to') || lowerMessage.includes('app') || 
        lowerMessage.includes('feature') || lowerMessage.includes('navigate')) {
      return 'APP_GUIDANCE';
    }

    if (lowerMessage.includes('payment') || lowerMessage.includes('bug') || 
        lowerMessage.includes('error') || lowerMessage.includes('login')) {
      return 'TECHNICAL_HELP';
    }

    if (lowerMessage.includes('islam') || lowerMessage.includes('muslim') || 
        lowerMessage.includes('prophet') || lowerMessage.includes('quran')) {
      return 'GENERAL_ISLAMIC';
    }

    return 'CLARIFICATION';
  }

  // Generate hadith-specific responses
  private generateHadithResponse(message: string): string {
    if (message.toLowerCase().includes('intention')) {
      return `I can help you understand hadiths about intentions (niyyah). The most famous is from Sahih al-Bukhari:

"Actions are judged by intentions, so each man will have what he intended."

This hadith (Bukhari 1) emphasizes that the purity and sincerity of one's intention determine the value and reward of their deeds. Would you like to know more about specific aspects of this hadith or explore other hadiths on intentions?`;
    }

    if (message.toLowerCase().includes('prayer') || message.toLowerCase().includes('salah')) {
      return `I'd be happy to help you with hadiths about prayer! There are many important hadiths about the importance, timing, and manner of prayer.

For example, the Prophet Muhammad ﷺ said: "The prayer of a person in congregation is twenty-five times more superior to the prayer offered alone in his house or in a market." (Bukhari 621)

What specific aspect of prayer would you like to learn about?`;
    }

    return `I'm here to help you understand hadiths better. Could you please specify:

1. Which hadith or topic you're interested in?
2. Any specific questions about the hadith's meaning or context?
3. Whether you're looking for hadiths on a particular theme?

This will help me provide you with accurate and relevant information with proper references.`;
  }

  // Generate app guidance responses
  private generateAppGuidance(message: string): string {
    if (message.toLowerCase().includes('search')) {
      return `To search for hadiths in Hadith Master:

1. Use the search bar on the main page
2. Enter keywords in English or Arabic
3. You can filter by book, narrator, or theme
4. Advanced search allows combining multiple criteria

The search works through our database of 34,178 hadiths from the six canonical books. Would you like me to guide you through a specific search?`;
    }

    if (message.toLowerCase().includes('save') || message.toLowerCase().includes('collection')) {
      return `To save hadiths to your collection:

1. Find a hadith you want to save
2. Click the bookmark icon (📖) on the hadith card
3. The hadith will be added to your "My Collection" tab
4. You can access your saved hadiths anytime

Your saved hadiths are stored locally in your browser. For premium users, we offer cloud sync across devices. Is there something specific about saving hadiths you need help with?`;
    }

    return `I can help you navigate Hadith Master! The app features:

• **Search**: Find hadiths by keywords, books, or narrators
• **Daily Hadith**: Get a new hadith each day for reflection
• **Collections**: Browse by book or theme
• **Save**: Build your personal hadith collection
• **Advanced Filters**: Refine searches by authenticity, narrator, etc.

What specific feature would you like to know more about?`;
  }

  // Generate general Islamic responses
  private generateGeneralIslamicResponse(message: string): string {
    return `I can provide general information about Islamic topics and point you to relevant hadiths. However, for specific religious rulings or detailed scholarly explanations, I'll connect you with our admin team who can provide proper scholarly guidance.

What specific Islamic topic would you like to learn about? I can share relevant hadiths and basic explanations, then escalate to our scholars if needed for deeper understanding.`;
  }

  // Generate technical support responses
  private generateTechnicalResponse(message: string): string {
    return `I understand you're experiencing a technical issue. For account access, payment problems, or bug reports, I need to connect you with our admin team who can:

• Review your account details securely
• Process payments or refunds
• Investigate system errors
• Provide personalized technical support

I'm escalating this to our admin team now. They typically respond within 5-10 minutes during business hours.`;
  }

  // Generate clarification responses
  private generateClarificationResponse(message: string): string {
    return `I'm here to help, but I want to make sure I understand your question correctly. Could you please:

1. Provide more specific details about what you'd like to know
2. Let me know if this is about a specific hadith, app feature, or general topic
3. Tell me if you've tried searching for this information already

This will help me give you the most helpful response or connect you with the right support if needed.`;
  }

  // Generate admin suggestion
  generateAdminSuggestion(userMessage: string, escalationReason: keyof typeof ESCALATION_REASONS): string {
    const suggestions = {
      [ESCALATION_REASONS.FATWA_REQUEST]: `Draft response: "Thank you for your question regarding Islamic law. Our scholars are reviewing your inquiry and will provide you with proper scholarly guidance based on authentic sources. Please allow us a moment to consult our resources and give you the attention this important question deserves."`,
      
      [ESCALATION_REASONS.ADMIN_REQUEST]: `Draft response: "I'm here to help you personally. I understand you wanted to speak with an admin directly. How can I assist you today with your Hadith Master experience?"`,
      
      [ESCALATION_REASONS.SENSITIVE_TOPIC]: `Draft response: "I appreciate you bringing this sensitive topic to our attention. Our team is committed to providing accurate, scholarly responses on important Islamic matters. Let me ensure you receive proper guidance on this subject."`,
      
      [ESCALATION_REASONS.TECHNICAL_SUPPORT]: `Draft response: "I'm sorry you're experiencing technical difficulties. I'm reviewing your account now and will help resolve this issue for you. Could you provide any additional details about when this problem started?"`,
      
      [ESCALATION_REASONS.EMOTIONAL_SUPPORT]: `Draft response: "I understand this may be concerning for you, and I'm here to help personally. Your spiritual journey is important, and I want to ensure you receive the support and guidance you need. Let's work through this together."`,
      
      [ESCALATION_REASONS.DISPUTE_AUTHENTICITY]: `Draft response: "Thank you for your thoughtful question about hadith authenticity. This is exactly the kind of scholarly engagement we encourage. Let me provide you with detailed information about the authentication process and specific hadith grading."`,
      
      [ESCALATION_REASONS.CONFUSION_AFTER_AI]: `Draft response: "I'm here to help clarify things personally. Sometimes complex topics need more detailed explanation than automated responses can provide. Let me make sure you get clear, accurate information that addresses your specific concerns."`,
      
      [ESCALATION_REASONS.PAYMENT_ISSUE]: `Draft response: "I'm sorry you're experiencing payment issues. I'm reviewing your account now and will resolve this for you personally. Your satisfaction is important to us, and I'll make sure this is handled properly."`,
      
      [ESCALATION_REASONS.BUG_REPORT]: `Draft response: "Thank you for reporting this issue. Our technical team takes bug reports seriously, and I'm personally ensuring this gets immediate attention. Could you provide any additional details that might help us reproduce and fix this problem?"`
    };

    return suggestions[escalationReason] || `Draft response: "Thank you for your message. I'm reviewing your inquiry and will provide you with personalized assistance to address your needs effectively."`;
  }

  // Record escalation for user
  recordEscalation(userId: string, reason: keyof typeof ESCALATION_REASONS): void {
    const userEscalations = this.escalationHistory.get(userId) || [];
    userEscalations.push(reason);
    this.escalationHistory.set(userId, userEscalations);
  }

  // Get user escalation history
  getUserEscalationHistory(userId: string): string[] {
    return this.escalationHistory.get(userId) || [];
  }

  // Clear escalation history (for testing or user reset)
  clearEscalationHistory(userId: string): void {
    this.escalationHistory.delete(userId);
  }

  // Clear response cache
  clearCache(): void {
    this.responseCache.clear();
  }
}

// Export singleton instance
export const chatService = ChatService.getInstance();
