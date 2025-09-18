// ⚡ Sandbox credentials
const merchantId = "PGTESTPAYUAT86";
const saltKey = "96434309-7796-489d-8924-ab56988a6076";
const saltIndex = 1;

async function startPayment() {
  const username = document.getElementById("username").textContent;
  const vehicleNumber = document.getElementById("vehiclenumber").textContent;
  const fuelType = document.getElementById("fueltype").textContent;
  const days = document.getElementById("days").textContent;
  const amount = document.getElementById("amount").textContent;
  const userId = document.getElementById("userId").textContent;

  if (!amount || parseInt(amount) <= 0) {
    alert("Invalid amount");
    return;
  }

  // Redirect URL with query params
  const redirectUrl = `https://swabee.github.io/gatepay/status.html?username=${encodeURIComponent(username)}&vehicle=${encodeURIComponent(vehicleNumber)}&fuel=${encodeURIComponent(fuelType)}&days=${encodeURIComponent(days)}&amount=${encodeURIComponent(amount)}&userId=${encodeURIComponent(userId)}`;

  // Payment payload
  const payload = {
    merchantId,
    merchantTransactionId: "T" + Date.now(),
    merchantUserId: userId,
    amount: parseInt(amount) * 100,
    redirectUrl: redirectUrl,
    redirectMode: "GET",
    callbackUrl: redirectUrl,
    mobileNumber: "9999999999",
    paymentInstrument: { type: "PAY_PAGE" }
  };

  // Base64 encode
  const base64Payload = btoa(JSON.stringify(payload));

  // Generate checksum SHA256
  const encoder = new TextEncoder();
  const str = base64Payload + "/pg/v1/pay" + saltKey;
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(str));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256 = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  const checksum = sha256 + "###" + saltIndex;

  // Call PhonePe API
  fetch("https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": merchantId
    },
    body: JSON.stringify({ request: base64Payload })
  })
    .then(res => res.json())
    .then(resp => {
      console.log("PhonePe Response:", resp);
      if (resp.success && resp.data?.instrumentResponse?.redirectInfo?.url) {
        window.location.href = resp.data.instrumentResponse.redirectInfo.url;
      } else {
        // For testing, just redirect directly
        window.location.href = redirectUrl;
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error starting payment");
    });
}
