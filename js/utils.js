/******************************************************************************
 * UTILITY FUNCTIONS
 ******************************************************************************/

import { state } from './state.js';

export function showScreen(screenId) {
  console.log(`📺 Switching to screen: ${screenId}`);
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add("active");
  } else {
    console.error(`❌ Screen not found: ${screenId}`);
  }
}

export function getColorHex(color) {
  const colors = {
    red: "#c92a2a",
    green: "#2f9e44",
    yellow: "#f59f00",
    blue: "#1971c2",
  };
  return colors[color] || "#000";
}

export function copyShareLink() {
  const shareLink = document.getElementById("shareLink");
  if (!shareLink) {
    console.error("❌ Share link element not found");
    return;
  }
  
  shareLink.select();
  shareLink.setSelectionRange(0, 99999);

  navigator.clipboard
    .writeText(shareLink.value)
    .then(() => {
      const btn = document.getElementById("copyLink");
      const originalText = btn.textContent;
      btn.textContent = "✓ Copied!";
      setTimeout(() => (btn.textContent = originalText), 2000);
      console.log("✅ Link copied to clipboard");
    })
    .catch(() => {
      document.execCommand("copy");
      console.log("✅ Link copied (fallback method)");
    });
}

export function shareOnWhatsApp() {
  const shareLink = document.getElementById("shareLink");
  if (!shareLink) {
    console.error("❌ Share link element not found");
    return;
  }
  
  const message = encodeURIComponent(
    `Join our Family Ludo game!\n\nClick here to play: ${shareLink.value}`
  );

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = `whatsapp://send?text=${message}`;
    setTimeout(() => {
      window.location.href = `https://wa.me/?text=${message}`;
    }, 800);
  } else {
    window.open(`https://web.whatsapp.com/send?text=${message}`, "_blank");
  }
  
  console.log("📱 Opening WhatsApp share...");
}