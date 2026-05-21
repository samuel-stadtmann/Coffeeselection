<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&amp;family=Noto+Serif:ital,wght@0,400;1,400&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "inverse-surface": "#31302d",
            "on-error-container": "#93000a",
            "surface-container-high": "#ebe8e3",
            "secondary-container": "#ebdec6",
            "primary": "#341706",
            "on-secondary-fixed-variant": "#4e4634",
            "on-primary-container": "#c29279",
            "on-tertiary-fixed": "#261a00",
            "on-background": "#1c1c19",
            "primary-fixed-dim": "#f0bba0",
            "on-surface": "#1c1c19",
            "inverse-on-surface": "#f4f0eb",
            "on-secondary-fixed": "#211b0c",
            "surface-variant": "#e6e2dd",
            "error": "#ba1a1a",
            "surface-container": "#f1ede8",
            "primary-container": "#4d2c19",
            "on-tertiary-fixed-variant": "#5c4300",
            "surface-dim": "#ddd9d5",
            "primary-fixed": "#ffdbca",
            "outline-variant": "#d5c3bb",
            "secondary-fixed-dim": "#d1c5ae",
            "on-tertiary-container": "#c79501",
            "tertiary-fixed-dim": "#f6be39",
            "on-primary": "#ffffff",
            "surface-bright": "#fdf9f4",
            "on-secondary": "#ffffff",
            "surface": "#fdf9f4",
            "outline": "#83746d",
            "on-error": "#ffffff",
            "error-container": "#ffdad6",
            "on-primary-fixed-variant": "#623e2a",
            "surface-container-lowest": "#ffffff",
            "tertiary": "#2a1d00",
            "on-tertiary": "#ffffff",
            "surface-container-highest": "#e6e2dd",
            "on-secondary-container": "#6b624f",
            "surface-container-low": "#f7f3ee",
            "tertiary-fixed": "#ffdfa0",
            "background": "#F9F5F0",
            "secondary-fixed": "#eee1c9",
            "on-primary-fixed": "#301404",
            "secondary": "#665d4b",
            "tertiary-container": "#453100",
            "surface-tint": "#7d553f",
            "inverse-primary": "#f0bba0",
            "on-surface-variant": "#51443e"
          },
          fontFamily: {
            "headline": ["Manrope"],
            "body": ["Noto Serif"],
            "label": ["Manrope"]
          },
          borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
        },
      },
    }
  </script>
<style>
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      vertical-align: middle;
    }
    .payment-option:has(input:checked) {
      background-color: #f1ede8;
      box-shadow: 0 0 0 2px #341706;
    }
  </style>
</head>
<body class="bg-[#F9F5F0] text-on-surface font-body antialiased">
<header class="fixed top-0 w-full z-50 bg-[#F9F5F0]/85 backdrop-blur-xl border-b border-outline-variant/10">
<nav class="flex justify-between items-center max-w-7xl mx-auto px-8 py-4 w-full">
<div class="flex items-center space-x-2">
<img alt="The Alpine Roast Logo" class="h-10 w-auto" src="https://lh3.googleusercontent.com/aida/ADBb0ugRAZCM5SrJlTMIN7z42waIBG1Z8FZXVL7I1jEs-qU7hjDq2N4ASNwSOMdu4FxkKIR6nAf7UHqU4I5npEIsgw4WyFaG_X0AvkIU8rg3pRcmeltA1SpP899XgzcISHOfRlrw_k_4ZYukIwg0aligXWGGqD038An-_vkqeA_ZHI7OHWQbsx0-j9e0tiNHSo5NxEhtY92n1Q3ru4hQzh2N8yqdZo5AVo_-H7JmcjukXCnPovA2aviwacHe25OXcmGwWbDZo5Eu1lxp"/>
<span class="text-2xl font-bold tracking-tight text-[#4D2C19] font-headline">The Alpine Roast</span>
</div>
<div class="hidden md:flex items-center space-x-10">
<a class="text-[#4D2C19] hover:text-[#D4A017] transition-colors font-label text-[10px] tracking-widest uppercase" href="#">Our Roasts</a>
<a class="text-[#4D2C19] hover:text-[#D4A017] transition-colors font-label text-[10px] tracking-widest uppercase" href="#">Subscriptions</a>
<a class="text-[#4D2C19] hover:text-[#D4A017] transition-colors font-label text-[10px] tracking-widest uppercase" href="#">Origins</a>
<a class="text-[#4D2C19] hover:text-[#D4A017] transition-colors font-label text-[10px] tracking-widest uppercase" href="#">The Ritual</a>
<a class="text-[#4D2C19] hover:text-[#D4A017] transition-colors font-label text-[10px] tracking-widest uppercase" href="#">Brewing Guides</a>
</div>
<div class="flex items-center space-x-6">
<span class="material-symbols-outlined text-primary text-2xl cursor-pointer hover:text-tertiary-fixed-dim transition-colors">shopping_bag</span>
<span class="material-symbols-outlined text-primary text-2xl cursor-pointer hover:text-tertiary-fixed-dim transition-colors">person</span>
<button class="bg-gradient-to-br from-primary to-primary-container text-white px-6 py-2 text-[10px] uppercase tracking-widest font-label font-bold rounded-lg shadow-sm hover:opacity-90 transition-all">
        Subscribe
      </button>
</div>
</nav>
</header>
<main class="pt-32 pb-24 px-6 md:px-12 max-w-[1440px] mx-auto min-h-screen">
<!-- Progress Stepper -->
<nav class="mb-16 max-w-2xl mx-auto">
<div class="flex items-center justify-between relative">
<div class="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant/20 -z-10"></div>
<div class="flex flex-col items-center gap-3">
<div class="bg-primary text-on-primary w-8 h-8 flex items-center justify-center rounded-full text-xs">
<span class="material-symbols-outlined text-sm">check</span>
</div>
<span class="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Shipping</span>
</div>
<div class="flex flex-col items-center gap-3">
<div class="bg-tertiary-fixed-dim text-on-tertiary-fixed w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold shadow-[0_0_20px_rgba(246,190,57,0.3)]">
          2
        </div>
<span class="font-label text-[10px] uppercase tracking-widest font-bold text-primary">Payment</span>
</div>
<div class="flex flex-col items-center gap-3">
<div class="bg-surface-container text-on-surface-variant w-8 h-8 flex items-center justify-center rounded-full text-xs">
          3
        </div>
<span class="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50">Review</span>
</div>
</div>
</nav>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
<!-- Checkout Form Canvas -->
<section class="lg:col-span-7">
<h1 class="font-headline text-3xl font-bold tracking-tight mb-2 text-primary">Secure Payment</h1>
<p class="font-body italic text-on-surface-variant mb-12">Select your preferred method to complete your Swiss coffee journey.</p>
<form class="space-y-6">
<!-- TWINT: Primary Swiss Method -->
<label class="payment-option relative block cursor-pointer transition-all p-6 bg-surface-container-low rounded-lg group">
<input checked="" class="sr-only" name="payment_method" type="radio" value="twint"/>
<div class="flex items-center justify-between">
<div class="flex items-center gap-6">
<div class="w-14 h-14 bg-white flex items-center justify-center rounded p-2 shadow-sm">
<span class="material-symbols-outlined text-3xl text-[#00a1e2]">qr_code_2</span>
</div>
<div>
<div class="flex items-center gap-2">
<span class="font-headline font-bold text-lg text-primary">TWINT</span>
<span class="bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter">Recommended</span>
</div>
<p class="text-sm text-on-surface-variant mt-1">Pay instantly with Switzerland's favorite mobile app.</p>
</div>
</div>
<div class="w-6 h-6 rounded-full border-2 border-outline-variant group-checked:border-primary flex items-center justify-center">
<div class="w-3 h-3 bg-primary rounded-full opacity-0 group-has-[:checked]:opacity-100"></div>
</div>
</div>
</label>
<!-- Credit Card -->
<label class="payment-option relative block cursor-pointer transition-all p-6 bg-surface-container-low rounded-lg group">
<input class="sr-only" name="payment_method" type="radio" value="card"/>
<div class="flex items-center justify-between">
<div class="flex items-center gap-6">
<div class="w-14 h-14 bg-white flex items-center justify-center rounded p-2 shadow-sm">
<span class="material-symbols-outlined text-3xl text-primary">credit_card</span>
</div>
<div>
<span class="font-headline font-bold text-lg text-primary">Credit Card</span>
<p class="text-sm text-on-surface-variant mt-1">Visa, Mastercard, or American Express.</p>
</div>
</div>
<div class="w-6 h-6 rounded-full border-2 border-outline-variant group-checked:border-primary flex items-center justify-center">
<div class="w-3 h-3 bg-primary rounded-full opacity-0 group-has-[:checked]:opacity-100"></div>
</div>
</div>
</label>
<!-- Apple Pay -->
<label class="payment-option relative block cursor-pointer transition-all p-6 bg-surface-container-low rounded-lg group">
<input class="sr-only" name="payment_method" type="radio" value="apple"/>
<div class="flex items-center justify-between">
<div class="flex items-center gap-6">
<div class="w-14 h-14 bg-white flex items-center justify-center rounded p-2 shadow-sm">
<span class="material-symbols-outlined text-3xl text-on-surface">contactless</span>
</div>
<div>
<span class="font-headline font-bold text-lg text-primary">Apple Pay</span>
<p class="text-sm text-on-surface-variant mt-1">Fast, secure checkout via your Apple device.</p>
</div>
</div>
<div class="w-6 h-6 rounded-full border-2 border-outline-variant group-checked:border-primary flex items-center justify-center">
<div class="w-3 h-3 bg-primary rounded-full opacity-0 group-has-[:checked]:opacity-100"></div>
</div>
</div>
</label>
<!-- Trust Badges -->
<div class="pt-8 mt-12 flex items-center gap-8 border-t-0 bg-surface-container-low/30 p-6 rounded">
<div class="flex items-center gap-2 opacity-60">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">verified_user</span>
<span class="font-label text-[10px] uppercase tracking-widest font-bold">256-bit SSL Secure</span>
</div>
<div class="flex items-center gap-2 opacity-60">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">encrypted</span>
<span class="font-label text-[10px] uppercase tracking-widest font-bold">Encrypted Data</span>
</div>
</div>
</form>
</section>
<!-- Summary Sidebar -->
<aside class="lg:col-span-5 space-y-8">
<div class="bg-surface-container-low p-8 rounded-lg shadow-[0_12px_40px_rgba(77,44,25,0.06)]">
<h2 class="font-headline text-lg font-bold text-primary mb-8 tracking-tight">Order Summary</h2>
<div class="space-y-6">
<div class="flex gap-4">
<div class="w-20 h-24 bg-surface-container shrink-0 overflow-hidden rounded">
<img alt="Alpine Roast Coffee" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNeGAsx5DyE0yMPy3O_xxM3J4Aif7Ogxgn7B9cKZm3NVgCeMqxDyHXNfhOeyBwAYYjUIad8dgueOmzLgtW0L8-xeXFVmvo4REF4aSp37THSasiwFbKKCmIZEAzmr6Bmei0mkF8c3nXLH0C_QKKeK3MRS3Le0Fjd9ABKNitF2I6-b86CrGVuKqrCzTv8mkKPj72CeeDxSXownaqL5VOrWSHHeXG5NR2goWkdUUwHGrH3rCGrYXVRztwStYRwEJT0uPq7rXK_LF0_g"/>
</div>
<div class="flex-1">
<p class="font-headline font-bold text-primary">Matterhorn Peak Blend</p>
<p class="text-xs font-label uppercase tracking-widest text-on-surface-variant mt-1">Whole Bean | 500g</p>
<div class="mt-4 flex justify-between items-end">
<span class="text-sm">Qty: 2</span>
<span class="font-headline font-bold text-primary">CHF 58.00</span>
</div>
</div>
</div>
<div class="pt-8 border-t border-outline-variant/20 space-y-3">
<div class="flex justify-between text-sm">
<span class="text-on-surface-variant">Subtotal</span>
<span class="font-headline text-primary">CHF 58.00</span>
</div>
<div class="flex justify-between text-sm">
<span class="text-on-surface-variant">Shipping (Swiss Post)</span>
<span class="font-headline text-primary italic">Free</span>
</div>
<div class="flex justify-between text-sm">
<span class="text-on-surface-variant">Tax (VAT 8.1%)</span>
<span class="font-headline text-primary">CHF 4.70</span>
</div>
</div>
<div class="pt-6 border-t border-primary/10 flex justify-between items-baseline">
<span class="font-headline font-bold text-xl text-primary">Total</span>
<span class="font-headline font-extrabold text-2xl text-primary">CHF 62.70</span>
</div>
</div>
<button class="w-full mt-12 bg-gradient-to-br from-primary to-primary-container text-on-primary py-5 font-label text-sm uppercase tracking-widest font-bold hover:opacity-90 transition-opacity rounded-lg flex items-center justify-center gap-3">
          Review Order
          <span class="material-symbols-outlined text-sm">arrow_forward</span>
</button>
<p class="text-center text-[11px] text-on-surface-variant mt-6 leading-relaxed">
          By proceeding, you agree to our <a class="underline" href="#">Terms of Service</a> and confirm that you are over 18 years of age.
        </p>
</div>
<!-- Help Section -->
<div class="bg-surface-container-high/50 p-6 rounded-lg text-center">
<p class="text-xs text-on-surface-variant mb-4">Need assistance with your payment?</p>
<a class="font-label text-[10px] uppercase tracking-widest font-bold text-primary border-b border-primary pb-1 inline-block" href="#">Contact Sommelier Support</a>
</div>
</aside>
</div>
</main>
<footer class="w-full py-20 bg-[#F9F5F0] text-primary flex flex-col items-center gap-8 px-12 text-center border-t border-outline-variant/10">
<div class="flex items-center gap-2">
<img alt="The Alpine Roast Logo" class="h-6 w-auto opacity-80" src="https://lh3.googleusercontent.com/aida/ADBb0ugRAZCM5SrJlTMIN7z42waIBG1Z8FZXVL7I1jEs-qU7hjDq2N4ASNwSOMdu4FxkKIR6nAf7UHqU4I5npEIsgw4WyFaG_X0AvkIU8rg3pRcmeltA1SpP899XgzcISHOfRlrw_k_4ZYukIwg0aligXWGGqD038An-_vkqeA_ZHI7OHWQbsx0-j9e0tiNHSo5NxEhtY92n1Q3ru4hQzh2N8yqdZo5AVo_-H7JmcjukXCnPovA2aviwacHe25OXcmGwWbDZo5Eu1lxp"/>
<span class="text-lg font-bold text-primary tracking-tighter">The Alpine Roast</span>
</div>
<div class="flex flex-wrap justify-center gap-x-12 gap-y-4">
<a class="font-['Noto_Serif'] italic text-sm text-on-primary-fixed-variant/60 hover:text-primary transition-all" href="#">Sustainability</a>
<a class="font-['Noto_Serif'] italic text-sm text-on-primary-fixed-variant/60 hover:text-primary transition-all" href="#">Newsletter</a>
<a class="font-['Noto_Serif'] italic text-sm text-on-primary-fixed-variant/60 hover:text-primary transition-all" href="#">Privacy Policy</a>
<a class="font-['Noto_Serif'] italic text-sm text-on-primary-fixed-variant/60 hover:text-primary transition-all" href="#">Terms of Service</a>
</div>
<p class="font-['Noto_Serif'] italic text-sm text-on-surface-variant/70 mt-4">© 2024 The Alpine Roast. Swiss Precision in Every Bean.</p>
</footer>
</body></html>