const businessRepository = require('../repositories/businessRepository');
const chatRepository = require('../repositories/chatRepository');
const depositRepository = require('../repositories/depositRepository');
const onboardRepository = require('../repositories/onboardRepository');
const sessionManager = require('../utils/sessionManager');
const logger = require('../utils/logger');

// Helper to build menu with optional onboarding and deposit
function buildMenu(business) {
  const menuOptions = business.flows
    .map((flow, i) => `${i + 1}. ${flow.optionTitle}`)
    .join('\n');
  let fullMenu = menuOptions;
  let nextNum = business.flows.length + 1;
  if (business.onboardingEnabled) {
    fullMenu += `\n${nextNum}. 📝 Create Account`;
    nextNum++;
  }
  if (business.paymentQrUrl) {
    fullMenu += `\n${nextNum}. 💰 Deposit`;
  }
  return fullMenu;
}

const webhookService = {
  async processIncoming(from, body) {
    logger.info('WebhookService', `Incoming message from: ${from}, body: "${body}"`);
    const trimmedBody = body.trim();

    // Check if user is in a multi-step session
    const session = sessionManager.get(from);
    if (session && session.flow === 'deposit') {
      return this.handleDepositStep(from, trimmedBody, session);
    }
    if (session && session.flow === 'onboard') {
      return this.handleOnboardStep(from, trimmedBody, session);
    }

    // "cancel" keyword — cancel any ongoing session
    if (trimmedBody.toLowerCase() === 'cancel') {
      sessionManager.clear(from);
      return { message: '❌ Cancelled.\n\n_Send "menu" to see options again._' };
    }

    // Twilio sandbox join message (e.g. "join means-rapidly")
    if (trimmedBody.toLowerCase().startsWith('join ')) {
      logger.info('WebhookService', `Twilio sandbox join detected from: ${from}`);
      return { message: '✅ *You\'re connected!*\n\nNow tap the bot link you received to start chatting. 🚀' };
    }

    // start_slug command
    if (trimmedBody.toLowerCase().startsWith('start_')) {
      const slug = trimmedBody.toLowerCase().replace('start_', '').trim();
      return this.handleStart(from, slug, trimmedBody);
    }

    // "menu" keyword
    if (trimmedBody.toLowerCase() === 'menu') {
      return this.handleMenu(from);
    }

    // Otherwise it's a menu selection
    return this.handleChoice(from, trimmedBody);
  },

  async handleStart(from, slug, originalMessage) {
    logger.info('WebhookService', `New conversation start for slug: ${slug}`);
    sessionManager.clear(from);

    const business = await businessRepository.findBySlug(slug);
    if (!business) {
      logger.warn('WebhookService', `No business found for slug: ${slug}`);
      return { message: 'Sorry, this bot link is not valid.' };
    }

    const fullMenu = buildMenu(business);

    const greeting = `${business.greetingMessage}\n\nChoose an option:\n${fullMenu}\n\n_Reply with the option number (1, 2, 3...)_`;

    await chatRepository.create({
      businessId: business.id,
      customerNumber: from,
      message: originalMessage,
      response: greeting,
    });

    logger.info('WebhookService', `Greeting sent for business: ${business.businessName}`);
    return { message: greeting };
  },

  async handleMenu(from) {
    logger.info('WebhookService', `Menu request from: ${from}`);
    sessionManager.clear(from);

    const lastChat = await chatRepository.findLastByCustomer(from);
    if (!lastChat) {
      return { message: 'Please use a valid bot link to start chatting.' };
    }
    const business = await businessRepository.findById(lastChat.businessId);
    if (!business || !business.flows || business.flows.length === 0) {
      return { message: 'No menu options available.' };
    }
    const fullMenu = buildMenu(business);

    return { message: `Choose an option:\n${fullMenu}\n\n_Reply with the option number (1, 2, 3...)_` };
  },

  async handleChoice(from, userChoice) {
    logger.info('WebhookService', `Processing user choice: "${userChoice}" from: ${from}`);

    const lastChat = await chatRepository.findLastByCustomer(from);
    if (!lastChat) {
      return { message: 'Please use a valid bot link to start chatting.\n\nExample: Send "start_yourbusiness" to begin.' };
    }

    const business = await businessRepository.findById(lastChat.businessId);
    if (!business || !business.flows || business.flows.length === 0) {
      return { message: 'Sorry, this business has no menu options configured yet.' };
    }

    // Match by number or title
    let matchedFlow = null;
    const choiceNum = parseInt(userChoice, 10);
    const hasDeposit = !!business.paymentQrUrl;
    const hasOnboarding = !!business.onboardingEnabled;
    let nextNum = business.flows.length + 1;
    const onboardOptionNum = hasOnboarding ? nextNum++ : -1;
    const depositOptionNum = hasDeposit ? nextNum : -1;

    // Check if user selected "Create Account" option
    if (hasOnboarding && (choiceNum === onboardOptionNum || userChoice.toLowerCase() === 'create account')) {
      logger.info('WebhookService', `User selected Create Account from: ${from}`);
      sessionManager.set(from, {
        flow: 'onboard',
        step: 'show_message',
        businessId: business.id,
        data: {},
      });

      const onboardMsg = business.onboardingMessage || 'Welcome! Let us help you get started.';
      const msg = `📝 *Create Account*\n\n${onboardMsg}\n\n_Type *next* to continue or *cancel* to go back._`;

      await chatRepository.create({
        businessId: business.id,
        customerNumber: from,
        message: userChoice,
        response: msg,
      });

      return { message: msg };
    }

    // Check if user selected the auto-added Deposit option (only if QR is set)
    if (hasDeposit && (choiceNum === depositOptionNum || userChoice.toLowerCase() === 'deposit')) {
      logger.info('WebhookService', `User selected Deposit option from: ${from}`);
      sessionManager.set(from, {
        flow: 'deposit',
        step: 'ask_name',
        businessId: business.id,
        data: {},
      });

      const msg = `💰 *Deposit*\n\nLet's process your deposit.\n\nPlease enter your *full name*:\n\n_Send "cancel" anytime to go back._`;

      await chatRepository.create({
        businessId: business.id,
        customerNumber: from,
        message: userChoice,
        response: msg,
      });

      return { message: msg };
    }

    if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= business.flows.length) {
      matchedFlow = business.flows[choiceNum - 1];
      logger.info('WebhookService', `Matched by number: ${choiceNum} → ${matchedFlow.optionTitle}`);
    } else {
      matchedFlow = business.flows.find(
        (f) => f.optionTitle.toLowerCase() === userChoice.toLowerCase()
      );
    }

    if (!matchedFlow) {
      const fullMenu = buildMenu(business);

      const retryMessage = `Sorry, I didn't understand "${userChoice}".\n\nPlease choose an option:\n${fullMenu}\n\n_Reply with the option number (1, 2, 3...)_`;

      await chatRepository.create({
        businessId: business.id,
        customerNumber: from,
        message: userChoice,
        response: retryMessage,
      });

      return { message: retryMessage };
    }

    // === DEPOSIT FLOW (from flow builder) ===
    if (matchedFlow.replyType === 'deposit' || matchedFlow.optionTitle.toLowerCase() === 'deposit') {
      if (!hasDeposit) {
        return { message: 'Deposit is not available. Admin has not configured a payment QR yet.\n\n_Send "menu" to see options again._' };
      }
      logger.info('WebhookService', `Starting deposit flow for ${from}`);
      sessionManager.set(from, {
        flow: 'deposit',
        step: 'ask_name',
        businessId: business.id,
        data: {},
      });

      const msg = `💰 *Deposit*\n\nLet's process your deposit.\n\nPlease enter your *full name*:\n\n_Send "cancel" anytime to go back._`;

      await chatRepository.create({
        businessId: business.id,
        customerNumber: from,
        message: userChoice,
        response: msg,
      });

      return { message: msg };
    }

    // Normal flow reply
    let replyMessage = '';
    switch (matchedFlow.replyType) {
      case 'pdf':
        replyMessage = `📄 *${matchedFlow.optionTitle}*\n\nHere's your document:\n${matchedFlow.replyValue}`;
        break;
      case 'link':
        replyMessage = `🔗 *${matchedFlow.optionTitle}*\n\nHere's the link:\n${matchedFlow.replyValue}`;
        break;
      case 'image':
        replyMessage = `🖼️ *${matchedFlow.optionTitle}*\n\n${matchedFlow.replyValue}`;
        break;
      default:
        replyMessage = `*${matchedFlow.optionTitle}*\n\n${matchedFlow.replyValue}`;
    }

    replyMessage += '\n\n---\n_Send "menu" to see options again._';

    await chatRepository.create({
      businessId: business.id,
      customerNumber: from,
      message: userChoice,
      response: replyMessage,
    });

    logger.info('WebhookService', `Reply sent for option: ${matchedFlow.optionTitle} (${matchedFlow.replyType})`);
    return { message: replyMessage };
  },

  // =============================================
  // MULTI-STEP DEPOSIT FLOW
  // =============================================
  async handleDepositStep(from, input, session) {
    logger.info('WebhookService', `Deposit step: ${session.step}, input: "${input}", from: ${from}`);

    // Allow cancel at any step
    if (input.toLowerCase() === 'cancel') {
      sessionManager.clear(from);
      return { message: '❌ Deposit cancelled.\n\n_Send "menu" to see options again._' };
    }

    switch (session.step) {
      case 'ask_name':
        return this.depositAskUserId(from, input, session);

      case 'ask_user_id':
        return this.depositShowQr(from, input, session);

      case 'ask_transaction_id':
        return this.depositAskAmount(from, input, session);

      case 'ask_amount':
        return this.depositSave(from, input, session);

      default:
        sessionManager.clear(from);
        return { message: 'Something went wrong. _Send "menu" to start again._' };
    }
  },

  async depositAskUserId(from, name, session) {
    if (name.length < 2) {
      return { message: '❌ Name is too short. Please enter your *full name*:' };
    }

    sessionManager.update(from, {
      step: 'ask_user_id',
      data: { name },
    });

    return { message: `Thanks *${name}*! 👍\n\nNow please enter your *User ID*:` };
  },

  async depositShowQr(from, userId, session) {
    if (userId.length < 1) {
      return { message: '❌ User ID cannot be empty. Please enter your *User ID*:' };
    }

    sessionManager.update(from, {
      step: 'ask_transaction_id',
      data: { userId },
    });

    // Get business QR
    const business = await businessRepository.findById(session.businessId);
    let qrMessage = `🆔 User ID: *${userId}* ✅\n\n`;

    if (business && business.paymentQrUrl) {
      qrMessage += `Please scan the QR code below to make payment:\n${business.paymentQrUrl}\n\n`;
    } else {
      qrMessage += `💳 Please complete your payment using the business payment method.\n\n`;
    }

    qrMessage += `After payment, enter your *12-digit Transaction ID*:`;

    return { message: qrMessage };
  },

  async depositAskAmount(from, transactionId, session) {
    // Validate 12-digit transaction ID
    const cleanTxn = transactionId.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanTxn.length !== 12) {
      return { message: `❌ Transaction ID must be exactly *12 digits*. You entered ${cleanTxn.length} characters.\n\nPlease enter a valid *12-digit Transaction ID*:` };
    }

    // Check if transaction ID already exists
    const existing = await depositRepository.findByTransactionId(cleanTxn);
    if (existing) {
      return { message: '❌ This Transaction ID has already been used. Please enter a *different 12-digit Transaction ID*:' };
    }

    sessionManager.update(from, {
      step: 'ask_amount',
      data: { transactionId: cleanTxn },
    });

    return { message: `✅ Transaction ID: *${cleanTxn}*\n\nNow enter the *deposit amount* (in ₹):` };
  },

  async depositSave(from, amountStr, session) {
    const amount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      return { message: '❌ Invalid amount. Please enter a valid *deposit amount* (e.g., 500):' };
    }

    // Save deposit to database
    try {
      const deposit = await depositRepository.create({
        businessId: session.businessId,
        customerName: session.data.name,
        customerNumber: session.data.userId,
        whatsappNumber: from,
        transactionId: session.data.transactionId,
        amount,
      });

      // Clear session
      sessionManager.clear(from);

      // Save chat log
      const successMsg = `✅ *Deposit Recorded Successfully!*\n\n` +
        `👤 Name: *${session.data.name}*\n` +
        `🆔 User ID: *${session.data.userId}*\n` +
        `🔢 Transaction ID: *${session.data.transactionId}*\n` +
        `💰 Amount: *₹${amount}*\n` +
        `📊 Status: *Pending*\n\n` +
        `Your deposit will be verified by the admin shortly.\n\n` +
        `_Send "menu" to see options again._`;

      await chatRepository.create({
        businessId: session.businessId,
        customerNumber: from,
        message: `Deposit: ${session.data.name}, ID:${session.data.userId}, TXN:${session.data.transactionId}, ₹${amount}`,
        response: successMsg,
      });

      logger.info('WebhookService', `Deposit saved: ${deposit.id} for business ${session.businessId}`);
      return { message: successMsg };
    } catch (err) {
      logger.error('WebhookService', 'Failed to save deposit', err.message);
      sessionManager.clear(from);
      return { message: '❌ Something went wrong saving your deposit. Please try again.\n\n_Send "menu" to start over._' };
    }
  },

  // =============================================
  // MULTI-STEP ONBOARDING FLOW
  // =============================================
  async handleOnboardStep(from, input, session) {
    logger.info('WebhookService', `Onboard step: ${session.step}, input: "${input}", from: ${from}`);

    // Allow cancel at any step
    if (input.toLowerCase() === 'cancel') {
      sessionManager.clear(from);
      return { message: '❌ Onboarding cancelled.\n\n_Send "menu" to see options again._' };
    }

    switch (session.step) {
      case 'show_message':
        return this.onboardShowOptions(from, input, session);

      case 'show_options':
        return this.onboardAskName(from, input, session);

      case 'ask_name':
        return this.onboardAskUserId(from, input, session);

      case 'ask_userid':
        return this.onboardComplete(from, input, session);

      case 'post_choice':
        return this.onboardPostChoice(from, input, session);

      default:
        sessionManager.clear(from);
        return { message: 'Something went wrong. _Send "menu" to start again._' };
    }
  },

  async onboardShowOptions(from, input, session) {
    // User must type "next" to proceed
    if (input.toLowerCase() !== 'next') {
      return { message: '_Type *next* to continue or *cancel* to go back._' };
    }

    const business = await businessRepository.findById(session.businessId);
    const optionsStr = business.onboardingOptions || '';
    const options = optionsStr.split(',').map(o => o.trim()).filter(o => o.length > 0);

    if (options.length === 0) {
      // No options configured, skip to ask name
      sessionManager.update(from, { step: 'ask_name', data: { selectedOption: '' } });
      return { message: 'Please enter your *full name*:' };
    }

    const optionsList = options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');

    sessionManager.update(from, { step: 'show_options', data: { options } });

    return { message: `Choose your option:\n${optionsList}\n\n_Reply with the option number._` };
  },

  async onboardAskName(from, input, session) {
    const options = session.data.options || [];
    const choiceNum = parseInt(input, 10);

    let selectedOption = '';
    if (options.length > 0) {
      if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > options.length) {
        const optionsList = options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
        return { message: `❌ Invalid choice.\n\nChoose your option:\n${optionsList}\n\n_Reply with the option number._` };
      }
      selectedOption = options[choiceNum - 1];
    }

    sessionManager.update(from, { step: 'ask_name', data: { selectedOption } });

    return { message: `✅ *${selectedOption}* selected!\n\nPlease enter your *full name*:` };
  },

  async onboardAskUserId(from, name, session) {
    if (name.length < 2) {
      return { message: '❌ Name is too short. Please enter your *full name*:' };
    }

    sessionManager.update(from, { step: 'ask_userid', data: { name } });

    return { message: `Thanks *${name}*! 👍\n\nEnter your *User ID* (or type *skip*):` };
  },

  async onboardComplete(from, input, session) {
    const userId = input.toLowerCase() === 'skip' ? '' : input;

    // Save onboard account
    try {
      await onboardRepository.create({
        businessId: session.businessId,
        customerName: session.data.name,
        userId,
        whatsappNumber: from,
        selectedOption: session.data.selectedOption || '',
      });

      sessionManager.update(from, { step: 'post_choice', data: { userId } });

      const greeting = userId
        ? `✅ Welcome *${session.data.name}* (ID: ${userId})! Account created. 🎉`
        : `✅ Welcome *${session.data.name}*! Account created. 🎉`;

      const msg = `${greeting}\n\nWhat would you like to do?\n1. 💰 Deposit\n2. 📋 Main Menu`;

      await chatRepository.create({
        businessId: session.businessId,
        customerNumber: from,
        message: `Onboard: ${session.data.name}, ID:${userId}, Option:${session.data.selectedOption}`,
        response: msg,
      });

      return { message: msg };
    } catch (err) {
      logger.error('WebhookService', 'Failed to save onboard account', err.message);
      sessionManager.clear(from);
      return { message: '❌ Something went wrong. Please try again.\n\n_Send "menu" to start over._' };
    }
  },

  async onboardPostChoice(from, input, session) {
    const choice = parseInt(input, 10);

    if (choice === 1) {
      // Transition to deposit flow with name/userId pre-filled
      const business = await businessRepository.findById(session.businessId);
      if (!business || !business.paymentQrUrl) {
        sessionManager.clear(from);
        return { message: 'Deposit is not available. Admin has not configured a payment QR yet.\n\n_Send "menu" to see options again._' };
      }

      sessionManager.set(from, {
        flow: 'deposit',
        step: 'ask_name',
        businessId: session.businessId,
        data: {},
      });

      // If we already have name from onboarding, pre-fill and skip to ask_user_id
      if (session.data.name) {
        sessionManager.set(from, {
          flow: 'deposit',
          step: 'ask_user_id',
          businessId: session.businessId,
          data: { name: session.data.name },
        });

        if (session.data.userId) {
          // Also have userId, skip to show QR
          sessionManager.set(from, {
            flow: 'deposit',
            step: 'ask_transaction_id',
            businessId: session.businessId,
            data: { name: session.data.name, userId: session.data.userId },
          });

          let qrMessage = `🆔 User ID: *${session.data.userId}* ✅\n\n`;
          if (business.paymentQrUrl) {
            qrMessage += `Please scan the QR code below to make payment:\n${business.paymentQrUrl}\n\n`;
          }
          qrMessage += `After payment, enter your *12-digit Transaction ID*:`;
          return { message: qrMessage };
        }

        return { message: `Thanks *${session.data.name}*! 👍\n\nNow please enter your *User ID*:` };
      }

      return { message: `💰 *Deposit*\n\nLet's process your deposit.\n\nPlease enter your *full name*:\n\n_Send "cancel" anytime to go back._` };
    }

    if (choice === 2) {
      // Show main menu
      sessionManager.clear(from);
      const business = await businessRepository.findById(session.businessId);
      if (!business || !business.flows || business.flows.length === 0) {
        return { message: 'No menu options available.' };
      }
      const fullMenu = buildMenu(business);
      return { message: `Choose an option:\n${fullMenu}\n\n_Reply with the option number (1, 2, 3...)_` };
    }

    return { message: 'Please choose:\n1. 💰 Deposit\n2. 📋 Main Menu' };
  },
};

module.exports = webhookService;
