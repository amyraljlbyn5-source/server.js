import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PAYPAL_CLIENT = "AVLzWeQuuhO3b_3mhx2jukDPgxIY8hRDAQ_O_bNu_f0CnEe9tn9wqEg9pkiuDFMeH8LpJ3nKw7iKE1su";
const PAYPAL_SECRET = "ECzLvLQ7N99s2UUZaWYurNC61y71MNP0LVUQWE-eiTRCGDjpwDGYOvtKmxG4ktxfSESIQ6Zspz1LdkQ-";
const PAYPAL_API = "https://api-m.paypal.com";

async function getAccessToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");

  const { data } = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
    auth: {
      username: PAYPAL_CLIENT,
      password: PAYPAL_SECRET,
    },
  });

  return data.access_token;
}

app.post("/withdraw", async (req, res) => {
  const { userEmail, amount } = req.body;

  if (!userEmail || !amount) {
    return res.status(400).json({ error: "يرجى إدخال البريد والمبلغ المطلوب" });
  }

  try {
    const accessToken = await getAccessToken();

    const payout = await axios.post(
      `${PAYPAL_API}/v1/payments/payouts`,
      {
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: "تم إرسال أرباحك من تطبيق Click & Earn",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: { value: amount, currency: "USD" },
            receiver: userEmail,
            note: "سحب الأرباح من التطبيق.",
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json({ success: true, message: "✅ تم إرسال الأرباح إلى حسابك", payout });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "حدث خطأ أثناء معالجة السحب" });
  }
});

app.listen(3000, () => console.log("✅ PayPal Server running on port 3000"));
