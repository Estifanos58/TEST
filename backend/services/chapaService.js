const axios = require('axios');
const crypto = require('crypto');

const CHAPA_API_URL = 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

const initializePayment = async (paymentDetails) => {
  try {
    const {
      amount,
      email,
      first_name,
      last_name,
      phone_number,
      tx_ref,
      title = 'DEMS Payment',
      description = 'Payment for DEMS services',
      callback_url,
      return_url
    } = paymentDetails;

    const requestBody = {
      amount: amount.toString(),
      currency: 'ETB',
      email: email,
      first_name: first_name,
      last_name: last_name,
      phone_number: phone_number,
      tx_ref: tx_ref,
      callback_url: callback_url || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/chapa/callback`,
      return_url: return_url || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?tx_ref=${tx_ref}`,
      customization: {
        title: title.substring(0, 16),
        description: description.substring(0, 50)
      }
    };

    const response = await axios.post(
      `${CHAPA_API_URL}/transaction/initialize`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status === 'success') {
      return {
        success: true,
        checkout_url: response.data.data.checkout_url,
        tx_ref: tx_ref
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Payment initialization failed'
      };
    }
  } catch (error) {
    console.error('Chapa payment initialization error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Payment service error'
    };
  }
};

const verifyPayment = async (tx_ref) => {
  try {
    const response = await axios.get(
      `${CHAPA_API_URL}/transaction/verify/${tx_ref}`,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`
        }
      }
    );

    if (response.data.status === 'success') {
      return {
        success: true,
        data: response.data.data,
        status: 'completed'
      };
    } else {
      return {
        success: false,
        status: 'failed',
        message: response.data.message
      };
    }
  } catch (error) {
    console.error('Chapa verification error:', error.response?.data || error.message);
    return {
      success: false,
      status: 'error',
      message: error.response?.data?.message || 'Verification failed'
    };
  }
};

module.exports = { initializePayment, verifyPayment };
