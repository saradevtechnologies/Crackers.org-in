/**
 * All customer-facing wording, in English and Tamil.
 * Keep this file free of imports so it can be copied as-is into the mobile app (lib/copy.ts).
 *
 * COPY: wording that depends on the legal model (platform sale vs. enquiry to a licensed seller).
 * Change it here once your lawyer confirms the model.
 */
export const COPY = {
  checkoutCta: 'Send enquiry',
  placedTitle: 'Enquiry sent',
  estimateTitle: 'Your estimate',
};

export type Lang = 'en' | 'ta';
export const LANGS: Lang[] = ['en', 'ta'];

type Entry = { en: string; ta: string };

export const MSG = {
  // ---------- Common ----------
  'common.back': { en: 'Back', ta: 'பின் செல்ல' },
  'common.next': { en: 'Next', ta: 'அடுத்து' },
  'common.edit': { en: 'Edit', ta: 'மாற்று' },
  'common.save': { en: 'Save', ta: 'சேமி' },
  'common.saving': { en: 'Saving…', ta: 'சேமிக்கிறது…' },
  'common.submit': { en: 'Submit', ta: 'சமர்ப்பி' },
  'common.show': { en: 'Show', ta: 'காட்டு' },
  'common.hide': { en: 'Hide', ta: 'மறை' },
  'common.copy': { en: 'Copy', ta: 'நகலெடு' },
  'common.copied': { en: 'Copied', ta: 'நகலெடுக்கப்பட்டது' },
  'common.optional': { en: 'optional', ta: 'விருப்பம்' },
  'common.tryAgain': { en: 'Something went wrong. Try again in a minute.', ta: 'ஏதோ தவறு நடந்தது. ஒரு நிமிடம் கழித்து மீண்டும் முயலுங்கள்.' },
  'common.tooManyTries': { en: 'Too many tries. Wait {wait} and try again.', ta: 'பல முறை முயன்றுவிட்டீர்கள். {wait} காத்திருந்து மீண்டும் முயலுங்கள்.' },
  'common.minutes': { en: '{n} min', ta: '{n} நிமிடம்' },
  'common.seconds': { en: '{n} sec', ta: '{n} விநாடி' },
  'lang.switch': { en: 'தமிழ்', ta: 'English' },
  'lang.switchLabel': { en: 'Switch to Tamil', ta: 'ஆங்கிலத்திற்கு மாற்று' },

  // ---------- Mobile OTP login ----------
  'login.title': { en: 'Sign in or sign up', ta: 'உள்நுழைக அல்லது பதிவு செய்க' },
  'login.sub': { en: 'Use your mobile number. We will send you a 6-digit code.', ta: 'உங்கள் மொபைல் எண்ணைப் பயன்படுத்துங்கள். 6 இலக்கக் குறியீட்டை அனுப்புவோம்.' },
  'login.mobile': { en: 'Mobile number', ta: 'மொபைல் எண்' },
  'login.getOtp': { en: 'Get OTP', ta: 'OTP பெறுக' },
  'login.sending': { en: 'Sending…', ta: 'அனுப்புகிறது…' },
  'login.badMobile': { en: 'Enter your 10-digit mobile number, starting with 6, 7, 8 or 9.', ta: '6, 7, 8 அல்லது 9-இல் தொடங்கும் 10 இலக்க மொபைல் எண்ணை உள்ளிடுங்கள்.' },
  'login.codeSent': { en: 'We sent a 6-digit code to {phone}', ta: '{phone} எண்ணுக்கு 6 இலக்கக் குறியீட்டை அனுப்பினோம்' },
  'login.otp': { en: 'OTP', ta: 'OTP' },
  'login.verify': { en: 'Verify', ta: 'சரிபார்' },
  'login.verifying': { en: 'Checking…', ta: 'சரிபார்க்கிறது…' },
  'login.changeNumber': { en: 'Change number', ta: 'எண்ணை மாற்று' },
  'login.resend': { en: 'Resend OTP', ta: 'OTP மீண்டும் அனுப்பு' },
  'login.resendIn': { en: 'Resend OTP in {s}s', ta: '{s} விநாடியில் மீண்டும் அனுப்பலாம்' },
  'login.resendWait': { en: 'You can resend in {wait}', ta: '{wait} கழித்து மீண்டும் அனுப்பலாம்' },
  'login.resent': { en: 'New code sent.', ta: 'புதிய குறியீடு அனுப்பப்பட்டது.' },
  'login.wrongCode': { en: "That code didn't match. Check the SMS and try again.", ta: 'குறியீடு பொருந்தவில்லை. SMS-ஐப் பார்த்து மீண்டும் முயலுங்கள்.' },
  'login.expiredCode': { en: 'Code expired. Tap Resend.', ta: 'குறியீடு காலாவதியானது. மீண்டும் அனுப்பு என்பதைத் தட்டுங்கள்.' },
  'login.smsFailed': { en: "We couldn't send the SMS. Check the number, or try again in a minute.", ta: 'SMS அனுப்ப முடியவில்லை. எண்ணைச் சரிபார்க்கவும், அல்லது ஒரு நிமிடம் கழித்து முயலுங்கள்.' },
  'login.smsLimit': { en: 'Too many codes were sent to this number. Wait a few minutes, then try again.', ta: 'இந்த எண்ணுக்கு பல குறியீடுகள் அனுப்பப்பட்டன. சில நிமிடங்கள் காத்திருந்து முயலுங்கள்.' },
  'login.yourName': { en: 'Your name', ta: 'உங்கள் பெயர்' },
  'login.nameTitle': { en: 'Welcome! What should we call you?', ta: 'வருக! உங்களை எப்படி அழைக்கலாம்?' },
  'login.nameNeeded': { en: 'Enter your name so shops know who the order is for.', ta: 'ஆர்டர் யாருக்கு என்று கடைகளுக்குத் தெரிய உங்கள் பெயரை உள்ளிடுங்கள்.' },
  'login.continue': { en: 'Continue', ta: 'தொடர்க' },
  'login.shopOwner': { en: 'Shop owner?', ta: 'கடை உரிமையாளரா?' },
  'login.bulkLink': { en: 'Bulk buyer login', ta: 'மொத்த வாங்குபவர் உள்நுழைவு' },
  'login.emailLink': { en: 'Seller or admin login', ta: 'விற்பனையாளர் / நிர்வாகி உள்நுழைவு' },

  // ---------- Email + password login ----------
  'pw.titleStaff': { en: 'Seller or admin login', ta: 'விற்பனையாளர் / நிர்வாகி உள்நுழைவு' },
  'pw.titleBulk': { en: 'Bulk buyer login', ta: 'மொத்த வாங்குபவர் உள்நுழைவு' },
  'pw.subBulk': { en: 'For approved shop owners. Use the email you applied with.', ta: 'அங்கீகரிக்கப்பட்ட கடை உரிமையாளர்களுக்கு. விண்ணப்பித்த மின்னஞ்சலைப் பயன்படுத்துங்கள்.' },
  'pw.email': { en: 'Email', ta: 'மின்னஞ்சல்' },
  'pw.password': { en: 'Password', ta: 'கடவுச்சொல்' },
  'pw.signIn': { en: 'Sign in', ta: 'உள்நுழை' },
  'pw.signingIn': { en: 'Signing in…', ta: 'உள்நுழைகிறது…' },
  'pw.wrong': { en: 'Email or password is incorrect. Try again, or tap "Forgot password?".', ta: 'மின்னஞ்சல் அல்லது கடவுச்சொல் தவறு. மீண்டும் முயலுங்கள், அல்லது "கடவுச்சொல் மறந்துவிட்டதா?" என்பதைத் தட்டுங்கள்.' },
  'pw.locked': { en: 'Too many tries. Wait 15 minutes or reset your password.', ta: 'பல முறை முயன்றுவிட்டீர்கள். 15 நிமிடம் காத்திருங்கள் அல்லது கடவுச்சொல்லை மாற்றுங்கள்.' },
  'pw.forgot': { en: 'Forgot password?', ta: 'கடவுச்சொல் மறந்துவிட்டதா?' },
  'pw.customerLink': { en: 'Buying for home? Sign in with your mobile', ta: 'வீட்டுக்கு வாங்குகிறீர்களா? மொபைல் எண்ணுடன் உள்நுழையுங்கள்' },
  'pw.pendingApp': { en: "Your application {no} is still being verified. We'll email you once it's approved.", ta: 'உங்கள் விண்ணப்பம் {no} இன்னும் சரிபார்க்கப்படுகிறது. அங்கீகரிக்கப்பட்டதும் மின்னஞ்சல் அனுப்புவோம்.' },
  'pw.notApplied': { en: 'Not approved yet? Apply for bulk prices', ta: 'இன்னும் அங்கீகரிக்கப்படவில்லையா? மொத்த விலைக்கு விண்ணப்பிக்கவும்' },

  // ---------- Sign-up chooser ----------
  'signup.title': { en: 'Create your account', ta: 'உங்கள் கணக்கை உருவாக்குங்கள்' },
  'signup.homeTitle': { en: 'Buying for home or family', ta: 'வீட்டுக்கு அல்லது குடும்பத்துக்காக வாங்குகிறேன்' },
  'signup.homeSub': { en: 'Sign up with your mobile number in 30 seconds', ta: 'உங்கள் மொபைல் எண்ணுடன் 30 விநாடிகளில் பதிவு செய்யுங்கள்' },
  'signup.shopTitle': { en: 'I own a crackers shop: bulk orders {min}+', ta: 'எனக்கு பட்டாசுக் கடை உள்ளது: {min}+ மொத்த ஆர்டர்கள்' },
  'signup.shopSub': { en: 'Apply for bulk prices. We verify your licence first.', ta: 'மொத்த விலைக்கு விண்ணப்பிக்கவும். முதலில் உங்கள் உரிமத்தைச் சரிபார்ப்போம்.' },
  'signup.haveAccount': { en: 'Already have an account?', ta: 'ஏற்கனவே கணக்கு உள்ளதா?' },
  'signup.signIn': { en: 'Sign in', ta: 'உள்நுழை' },

  // ---------- Account ----------
  'account.title': { en: 'My account', ta: 'என் கணக்கு' },
  'account.phoneLocked': { en: 'To change your number, contact support.', ta: 'எண்ணை மாற்ற, உதவி மையத்தைத் தொடர்பு கொள்ளுங்கள்.' },

  // ---------- Passwords and email links ----------
  'pwset.title': { en: 'Set your password', ta: 'உங்கள் கடவுச்சொல்லை அமைக்கவும்' },
  'pwset.sub': { en: 'You will use this with your email to log in.', ta: 'உள்நுழைய உங்கள் மின்னஞ்சலுடன் இதைப் பயன்படுத்துவீர்கள்.' },
  'pwset.new': { en: 'New password', ta: 'புதிய கடவுச்சொல்' },
  'pwset.confirm': { en: 'Confirm password', ta: 'கடவுச்சொல்லை உறுதிப்படுத்துக' },
  'pwset.ruleLength': { en: 'At least 8 characters', ta: 'குறைந்தது 8 எழுத்துகள்' },
  'pwset.ruleCommon': { en: 'Not a common password', ta: 'பொதுவான கடவுச்சொல் அல்ல' },
  'pwset.mismatch': { en: "The two passwords don't match. Type them again.", ta: 'இரண்டு கடவுச்சொற்களும் பொருந்தவில்லை. மீண்டும் தட்டச்சு செய்யுங்கள்.' },
  'pwset.tooShort': { en: 'Use at least 8 characters. A short sentence is easy to remember.', ta: 'குறைந்தது 8 எழுத்துகளைப் பயன்படுத்துங்கள். ஒரு சிறிய வாக்கியம் நினைவில் வைக்க எளிது.' },
  'pwset.common': { en: 'That password is too easy to guess. Try a few words together, like "blue mango river".', ta: 'அந்தக் கடவுச்சொல்லை எளிதில் ஊகிக்கலாம். "blue mango river" போல சில சொற்களைச் சேர்த்து முயலுங்கள்.' },
  'pwset.save': { en: 'Save password', ta: 'கடவுச்சொல்லைச் சேமி' },
  'pwset.done': { en: "Password set. You're logged in.", ta: 'கடவுச்சொல் அமைக்கப்பட்டது. நீங்கள் உள்நுழைந்துவிட்டீர்கள்.' },
  'pwset.sessionGone': { en: 'This link has expired. Ask for a new one below.', ta: 'இந்த இணைப்பு காலாவதியானது. கீழே புதியதைக் கேளுங்கள்.' },
  'pwset.needCode': { en: 'Verify the code sent to your mobile first.', ta: 'முதலில் உங்கள் மொபைலுக்கு அனுப்பிய குறியீட்டைச் சரிபார்க்கவும்.' },
  'pwset.wa': { en: 'your crackers.org.in password was changed. If this wasn\'t you, call {support}.', ta: 'உங்கள் crackers.org.in கடவுச்சொல் மாற்றப்பட்டது. நீங்கள் செய்யவில்லை என்றால் {support} ஐ அழையுங்கள்.' },
  'forgot.title': { en: 'Forgot password?', ta: 'கடவுச்சொல் மறந்துவிட்டதா?' },
  'forgot.sub': { en: 'For bulk buyers, sellers and admins. Enter the email you log in with.', ta: 'மொத்த வாங்குபவர், விற்பனையாளர், நிர்வாகிகளுக்கு. உள்நுழையும் மின்னஞ்சலை உள்ளிடுங்கள்.' },
  'forgot.send': { en: 'Send reset link', ta: 'மாற்று இணைப்பை அனுப்பு' },
  'forgot.sent': { en: "If this email is registered, we've sent a reset link. Check your inbox and spam folder.", ta: 'இந்த மின்னஞ்சல் பதிவு செய்யப்பட்டிருந்தால், மாற்று இணைப்பை அனுப்பியுள்ளோம். இன்பாக்ஸ் மற்றும் ஸ்பேம் கோப்புறையைப் பாருங்கள்.' },
  'forgot.limit': { en: "You've asked for several links in the last hour. Check your inbox and spam folder, or try again in {wait}.", ta: 'கடந்த ஒரு மணி நேரத்தில் பல இணைப்புகளைக் கேட்டுள்ளீர்கள். இன்பாக்ஸ், ஸ்பேம் கோப்புறையைப் பாருங்கள், அல்லது {wait} கழித்து முயலுங்கள்.' },
  'forgot.customer': { en: 'Customers sign in with mobile OTP. No password needed.', ta: 'வாடிக்கையாளர்கள் மொபைல் OTP மூலம் உள்நுழைவார்கள். கடவுச்சொல் தேவையில்லை.' },
  'forgot.appNote': { en: "We've emailed you a link. Open it, set your new password, then come back and log in.", ta: 'உங்களுக்கு ஒரு இணைப்பை மின்னஞ்சல் செய்துள்ளோம். அதைத் திறந்து புதிய கடவுச்சொல்லை அமைத்து, பின் திரும்பி வந்து உள்நுழையுங்கள்.' },
  'expired.title': { en: 'This link has expired', ta: 'இந்த இணைப்பு காலாவதியானது' },
  'expired.body': { en: 'Email links work once and expire after a while. Ask for a new one and use it within an hour.', ta: 'மின்னஞ்சல் இணைப்புகள் ஒரு முறை மட்டுமே வேலை செய்யும், சிறிது நேரத்தில் காலாவதியாகும். புதியதைக் கேட்டு ஒரு மணி நேரத்துக்குள் பயன்படுத்துங்கள்.' },
  'expired.cta': { en: 'Send a new link', ta: 'புதிய இணைப்பை அனுப்பு' },
  'stepup.title': { en: 'One more check', ta: 'இன்னும் ஒரு சரிபார்ப்பு' },
  'stepup.sent': { en: 'We sent a code to {phone}', ta: '{phone} எண்ணுக்கு ஒரு குறியீட்டை அனுப்பினோம்' },
  'stepup.why': { en: 'This keeps your bulk account safe even if someone gets into your email.', ta: 'யாராவது உங்கள் மின்னஞ்சலுக்குள் நுழைந்தாலும் இது உங்கள் மொத்தக் கணக்கைப் பாதுகாக்கும்.' },
  'stepup.wrong': { en: "That code didn't match. {n} tries left.", ta: 'குறியீடு பொருந்தவில்லை. இன்னும் {n} முயற்சிகள் உள்ளன.' },
  'stepup.locked': { en: 'Too many wrong codes. Tap Resend to get a new one.', ta: 'பல தவறான குறியீடுகள். புதியதைப் பெற மீண்டும் அனுப்பு என்பதைத் தட்டுங்கள்.' },
  'stepup.sendFailed': { en: "We couldn't send the code right now. Try Resend in a minute, or call support.", ta: 'இப்போது குறியீட்டை அனுப்ப முடியவில்லை. ஒரு நிமிடம் கழித்து மீண்டும் அனுப்பு, அல்லது உதவி மையத்தை அழையுங்கள்.' },

  // ---------- Bulk application ----------
  'bulk.apply.title': { en: 'Apply for bulk prices', ta: 'மொத்த விலைக்கு விண்ணப்பிக்கவும்' },
  'bulk.apply.sub': { en: 'For licensed crackers shop owners. Bulk orders start at {min}.', ta: 'உரிமம் பெற்ற பட்டாசுக் கடை உரிமையாளர்களுக்கு. மொத்த ஆர்டர்கள் {min} முதல்.' },
  'bulk.step': { en: 'Step {n} of 3', ta: 'படி {n} / 3' },
  'bulk.step1': { en: 'Shop details', ta: 'கடை விவரங்கள்' },
  'bulk.step2': { en: 'Documents', ta: 'ஆவணங்கள்' },
  'bulk.step3': { en: 'Review & submit', ta: 'சரிபார்த்து சமர்ப்பிக்கவும்' },
  'bulk.f.shopName': { en: 'Shop name', ta: 'கடையின் பெயர்' },
  'bulk.f.ownerName': { en: 'Owner name', ta: 'உரிமையாளர் பெயர்' },
  'bulk.f.mobile': { en: 'Mobile number', ta: 'மொபைல் எண்' },
  'bulk.f.email': { en: 'Email', ta: 'மின்னஞ்சல்' },
  'bulk.f.emailHint': { en: 'We send your login details here after approval.', ta: 'அங்கீகாரத்துக்குப் பின் உள்நுழைவு விவரங்களை இங்கு அனுப்புவோம்.' },
  'bulk.f.address': { en: 'Shop address', ta: 'கடை முகவரி' },
  'bulk.f.city': { en: 'Town / city', ta: 'ஊர் / நகரம்' },
  'bulk.f.state': { en: 'State', ta: 'மாநிலம்' },
  'bulk.f.pincode': { en: 'PIN code', ta: 'அஞ்சல் குறியீடு (PIN)' },
  'bulk.f.gstin': { en: 'GSTIN', ta: 'GSTIN' },
  'bulk.f.licenceNo': { en: 'Licence number', ta: 'உரிம எண்' },
  'bulk.f.licenceExpiry': { en: 'Licence valid until', ta: 'உரிமம் செல்லுபடியாகும் தேதி' },
  'bulk.f.licenceFile': { en: 'Licence certificate', ta: 'உரிமச் சான்றிதழ்' },
  'bulk.f.otherFile': { en: 'Other document', ta: 'பிற ஆவணம்' },
  'bulk.f.otherFileHint': { en: 'Shop photo or GST certificate', ta: 'கடையின் புகைப்படம் அல்லது GST சான்றிதழ்' },
  'bulk.f.fileHint': { en: 'PDF, JPG or PNG, up to 8 MB', ta: 'PDF, JPG அல்லது PNG, 8 MB வரை' },
  'bulk.f.chooseFile': { en: 'Choose file', ta: 'கோப்பைத் தேர்ந்தெடு' },
  'bulk.f.addFile': { en: 'Add another file', ta: 'மேலும் ஒரு கோப்பு சேர்' },
  'bulk.f.removeFile': { en: 'Remove', ta: 'நீக்கு' },
  'bulk.e.required': { en: 'This is required.', ta: 'இது கட்டாயம்.' },
  'bulk.e.email': { en: 'Enter a valid email, like name@gmail.com.', ta: 'சரியான மின்னஞ்சலை உள்ளிடுங்கள், எ.கா. name@gmail.com.' },
  'bulk.e.pincode': { en: 'Enter the 6-digit PIN code.', ta: '6 இலக்க PIN குறியீட்டை உள்ளிடுங்கள்.' },
  'bulk.e.gstin': { en: 'GSTIN has 15 letters and numbers, like 33ABCDE1234F1Z5.', ta: 'GSTIN-இல் 15 எழுத்துகள், எண்கள் இருக்கும், எ.கா. 33ABCDE1234F1Z5.' },
  'bulk.e.expiry': { en: 'The licence must be valid after today. If it has expired, renew it first.', ta: 'உரிமம் இன்றைக்குப் பிறகும் செல்லுபடியாக இருக்க வேண்டும். காலாவதியானால் முதலில் புதுப்பியுங்கள்.' },
  'bulk.e.licenceFile': { en: 'Upload your licence certificate.', ta: 'உங்கள் உரிமச் சான்றிதழைப் பதிவேற்றுங்கள்.' },
  'bulk.e.fileType': { en: 'Use a PDF, JPG or PNG file.', ta: 'PDF, JPG அல்லது PNG கோப்பைப் பயன்படுத்துங்கள்.' },
  'bulk.e.fileSize': { en: 'This file is over 8 MB. Use a smaller photo or scan.', ta: 'இந்தக் கோப்பு 8 MB-க்கு மேல் உள்ளது. சிறிய புகைப்படம் அல்லது ஸ்கேனைப் பயன்படுத்துங்கள்.' },
  'bulk.e.tooManyFiles': { en: 'You can upload up to 3 files.', ta: 'அதிகபட்சம் 3 கோப்புகளைப் பதிவேற்றலாம்.' },
  'bulk.e.confirm': { en: 'Tick the box to confirm.', ta: 'உறுதிப்படுத்த பெட்டியைத் தேர்வு செய்யுங்கள்.' },
  'bulk.e.duplicate': { en: 'An application with this mobile/email already exists. Check its status here', ta: 'இந்த மொபைல்/மின்னஞ்சலுடன் ஏற்கனவே ஒரு விண்ணப்பம் உள்ளது. அதன் நிலையை இங்கே பாருங்கள்' },
  'bulk.e.rateLimit': { en: 'Too many applications from this number or network today. Try again tomorrow, or call support.', ta: 'இன்று இந்த எண் அல்லது இணையத்திலிருந்து பல விண்ணப்பங்கள் வந்துள்ளன. நாளை முயலுங்கள், அல்லது உதவி மையத்தை அழையுங்கள்.' },
  'bulk.e.upload': { en: 'Upload failed. Check your internet and submit again.', ta: 'பதிவேற்றம் தோல்வியடைந்தது. இணையத்தைச் சரிபார்த்து மீண்டும் சமர்ப்பியுங்கள்.' },
  'bulk.e.captcha': { en: 'Please complete the check above and submit again.', ta: 'மேலே உள்ள சரிபார்ப்பை முடித்து மீண்டும் சமர்ப்பியுங்கள்.' },
  'bulk.e.fixStep': { en: 'Fix the highlighted fields to continue.', ta: 'தொடர, குறிக்கப்பட்ட புலங்களைச் சரிசெய்யுங்கள்.' },
  'bulk.confirm': { en: 'I confirm these details are correct and I hold a valid licence to sell fireworks', ta: 'இந்த விவரங்கள் சரியானவை என்றும், பட்டாசு விற்க எனக்குச் செல்லுபடியான உரிமம் உள்ளது என்றும் உறுதிப்படுத்துகிறேன்' },
  'bulk.submit': { en: 'Submit application', ta: 'விண்ணப்பத்தைச் சமர்ப்பி' },
  'bulk.submitting': { en: 'Submitting…', ta: 'சமர்ப்பிக்கிறது…' },
  'bulk.uploading': { en: 'Uploading documents…', ta: 'ஆவணங்களைப் பதிவேற்றுகிறது…' },
  'bulk.files': { en: 'Files', ta: 'கோப்புகள்' },
  'bulk.success.title': { en: 'Your account has been created.', ta: 'உங்கள் கணக்கு உருவாக்கப்பட்டது.' },
  'bulk.success.appNo': { en: 'Application number:', ta: 'விண்ணப்ப எண்:' },
  'bulk.success.body': { en: 'After successful verification, we will send your login details to {email}. Verification usually takes 1–2 working days.', ta: 'வெற்றிகரமான சரிபார்ப்புக்குப் பின், உங்கள் உள்நுழைவு விவரங்களை {email} முகவரிக்கு அனுப்புவோம். சரிபார்ப்புக்கு வழக்கமாக 1–2 வேலை நாட்கள் ஆகும்.' },
  'bulk.success.status': { en: 'Check application status', ta: 'விண்ணப்ப நிலையைப் பாருங்கள்' },
  'bulk.wa.received': { en: "We received your bulk buyer application {no}. We'll verify your details within 1–2 working days.", ta: 'உங்கள் மொத்த வாங்குபவர் விண்ணப்பம் {no} கிடைத்தது. 1–2 வேலை நாட்களில் உங்கள் விவரங்களைச் சரிபார்ப்போம்.' },
  'bulk.wa.approved': { en: 'Your bulk buyer account is approved. Check your email ({email}) to set your password and log in.', ta: 'உங்கள் மொத்த வாங்குபவர் கணக்கு அங்கீகரிக்கப்பட்டது. கடவுச்சொல்லை அமைத்து உள்நுழைய உங்கள் மின்னஞ்சலைப் ({email}) பாருங்கள்.' },
  'bulk.resubmit.title': { en: 'Apply again for {no}', ta: '{no} க்கு மீண்டும் விண்ணப்பிக்கவும்' },
  'bulk.resubmit.sub': { en: 'Enter the mobile number you applied with. We will fill in your shop details.', ta: 'விண்ணப்பித்த மொபைல் எண்ணை உள்ளிடுங்கள். உங்கள் கடை விவரங்களை நிரப்புவோம்.' },
  'bulk.resubmit.load': { en: 'Load my details', ta: 'என் விவரங்களை ஏற்று' },
  'bulk.resubmit.skip': { en: 'Start a new application instead', ta: 'புதிய விண்ணப்பத்தைத் தொடங்கு' },

  // ---------- Application status ----------
  'bulk.status.title': { en: 'Check application status', ta: 'விண்ணப்ப நிலையைப் பாருங்கள்' },
  'bulk.status.appNo': { en: 'Application number', ta: 'விண்ணப்ப எண்' },
  'bulk.status.check': { en: 'Check status', ta: 'நிலையைப் பார்' },
  'bulk.status.notFound': { en: "We couldn't find an application with that number and mobile. Check both and try again.", ta: 'அந்த எண் மற்றும் மொபைலுடன் விண்ணப்பம் எதுவும் இல்லை. இரண்டையும் சரிபார்த்து மீண்டும் முயலுங்கள்.' },
  'bulk.s.pending': { en: "Pending: we're verifying your details. This usually takes 1–2 working days.", ta: 'நிலுவையில்: உங்கள் விவரங்களைச் சரிபார்க்கிறோம். வழக்கமாக 1–2 வேலை நாட்கள் ஆகும்.' },
  'bulk.s.approved': { en: 'Approved: check your email to set your password, then log in.', ta: 'அங்கீகரிக்கப்பட்டது: கடவுச்சொல்லை அமைக்க மின்னஞ்சலைப் பார்த்து, பின் உள்நுழையுங்கள்.' },
  'bulk.s.rejected': { en: 'Not approved: {reason}', ta: 'அங்கீகரிக்கப்படவில்லை: {reason}' },
  'bulk.s.resubmit': { en: 'Fix and apply again', ta: 'சரிசெய்து மீண்டும் விண்ணப்பிக்கவும்' },
  'bulk.s.suspended': { en: 'Suspended. Call support to find out why.', ta: 'இடைநிறுத்தப்பட்டது. காரணம் அறிய உதவி மையத்தை அழையுங்கள்.' },
  'bulk.s.renewal_pending': { en: "Licence renewal received. We're verifying it.", ta: 'உரிமப் புதுப்பிப்பு கிடைத்தது. சரிபார்க்கிறோம்.' },
  'bulk.label.pending': { en: 'Pending', ta: 'நிலுவையில்' },
  'bulk.label.approved': { en: 'Approved', ta: 'அங்கீகரிக்கப்பட்டது' },
  'bulk.label.rejected': { en: 'Rejected', ta: 'நிராகரிக்கப்பட்டது' },
  'bulk.label.suspended': { en: 'Suspended', ta: 'இடைநிறுத்தப்பட்டது' },
  'bulk.label.renewal_pending': { en: 'Renewal pending', ta: 'புதுப்பிப்பு நிலுவையில்' },

  // ---------- Bulk buyer account ----------
  'bulk.acct.title': { en: 'Bulk buyer account', ta: 'மொத்த வாங்குபவர் கணக்கு' },
  'bulk.acct.status': { en: 'Status', ta: 'நிலை' },
  'bulk.acct.renew': { en: 'Renew licence', ta: 'உரிமத்தைப் புதுப்பி' },
  'bulk.acct.renewTitle': { en: 'Renew your licence', ta: 'உங்கள் உரிமத்தைப் புதுப்பியுங்கள்' },
  'bulk.acct.renewSent': { en: "Thanks. We'll verify your new licence within 1–2 working days. Bulk prices switch back on after approval.", ta: 'நன்றி. 1–2 வேலை நாட்களில் புதிய உரிமத்தைச் சரிபார்ப்போம். அங்கீகாரத்துக்குப் பின் மொத்த விலைகள் மீண்டும் செயல்படும்.' },
  'bulk.acct.expiresSoon': { en: 'Your licence expires on {date}. Renew it to keep bulk prices.', ta: 'உங்கள் உரிமம் {date} அன்று காலாவதியாகும். மொத்த விலைகளைத் தொடர புதுப்பியுங்கள்.' },
  'bulk.acct.expired': { en: 'Your licence expired on {date}. Renew it to switch bulk prices back on.', ta: 'உங்கள் உரிமம் {date} அன்று காலாவதியானது. மொத்த விலைகளை மீண்டும் பெற புதுப்பியுங்கள்.' },
  'bulk.paused': { en: 'Bulk prices are paused: {reason}.', ta: 'மொத்த விலைகள் நிறுத்தப்பட்டுள்ளன: {reason}.' },
  'bulk.reason.expired': { en: 'your licence has expired', ta: 'உங்கள் உரிமம் காலாவதியானது' },
  'bulk.reason.suspended': { en: 'your account is suspended', ta: 'உங்கள் கணக்கு இடைநிறுத்தப்பட்டுள்ளது' },
  'bulk.reason.renewal': { en: 'your new licence is being verified', ta: 'உங்கள் புதிய உரிமம் சரிபார்க்கப்படுகிறது' },
  'bulk.reason.rejected': { en: 'your licence renewal was not approved', ta: 'உங்கள் உரிமப் புதுப்பிப்பு அங்கீகரிக்கப்படவில்லை' },

  // ---------- Prices ----------
  'price.bulk': { en: 'Bulk price', ta: 'மொத்த விலை' },
  'price.normal': { en: 'Normal price', ta: 'வழக்கமான விலை' },
  'price.noBulk': { en: 'No bulk price – normal price applies', ta: 'மொத்த விலை இல்லை – வழக்கமான விலை பொருந்தும்' },
  'price.noBulkShort': { en: 'No bulk price', ta: 'மொத்த விலை இல்லை' },
  'price.each': { en: '{price} each', ta: 'ஒன்றுக்கு {price}' },

  // ---------- Estimate / checkout ----------
  'est.typeTitle': { en: 'Order type', ta: 'ஆர்டர் வகை' },
  'est.bulkOption': { en: 'Bulk order', ta: 'மொத்த ஆர்டர்' },
  'est.bulkDesc': { en: 'Bulk prices · total {total} · minimum {min}', ta: 'மொத்த விலைகள் · மொத்தம் {total} · குறைந்தபட்சம் {min}' },
  'est.addMore': { en: 'Add {amount} more for bulk prices', ta: 'மொத்த விலைக்கு இன்னும் {amount} சேர்க்கவும்' },
  'est.regularOption': { en: 'Regular order', ta: 'வழக்கமான ஆர்டர்' },
  'est.regularDesc': { en: 'Normal prices · total {total}', ta: 'வழக்கமான விலைகள் · மொத்தம் {total}' },
  'checkout.gstNote': { en: 'GST invoice will be issued to {gstin}', ta: 'GST விலைப்பட்டியல் {gstin} க்கு வழங்கப்படும்' },
  'checkout.bulkBadge': { en: 'Bulk order', ta: 'மொத்த ஆர்டர்' },
  'checkout.bulkBelowMin': { en: 'This cart is below the bulk minimum. Go back to the estimate and choose Regular order, or add more.', ta: 'இந்த கூடை மொத்த குறைந்தபட்சத்துக்குக் கீழ் உள்ளது. மதிப்பீட்டுக்குச் சென்று வழக்கமான ஆர்டரைத் தேர்வு செய்யுங்கள், அல்லது மேலும் சேர்க்கவும்.' },

  // ---------- Bank transfer payment ----------
  'pay.bankTitle': { en: 'Pay by bank transfer', ta: 'வங்கிப் பரிமாற்றம் மூலம் செலுத்துங்கள்' },
  'pay.amount': { en: 'Amount', ta: 'தொகை' },
  'pay.accountName': { en: 'Account name', ta: 'கணக்குப் பெயர்' },
  'pay.accountNumber': { en: 'Account number', ta: 'கணக்கு எண்' },
  'pay.ifsc': { en: 'IFSC', ta: 'IFSC' },
  'pay.bank': { en: 'Bank', ta: 'வங்கி' },
  'pay.branch': { en: 'Branch', ta: 'கிளை' },
  'pay.bankNote': { en: 'Use NEFT/RTGS/IMPS. Add {order} in the remarks.', ta: 'NEFT/RTGS/IMPS பயன்படுத்துங்கள். குறிப்பில் {order} என்று சேர்க்கவும்.' },
  'pay.bankRef': { en: 'Bank transfer reference (UTR)', ta: 'வங்கிப் பரிமாற்றக் குறிப்பு எண் (UTR)' },
  'pay.bankRefHint': { en: 'Find it in your bank app or on the transfer receipt', ta: 'உங்கள் வங்கி ஆப்பில் அல்லது பரிமாற்ற ரசீதில் இருக்கும்' },
  'pay.bankRefError': { en: 'Enter the 10 to 22 letters/numbers from your bank app or receipt.', ta: 'உங்கள் வங்கி ஆப் அல்லது ரசீதில் உள்ள 10 முதல் 22 எழுத்து/எண்களை உள்ளிடுங்கள்.' },
  'pay.receipt': { en: 'Transfer receipt', ta: 'பரிமாற்ற ரசீது' },
  'pay.paidSubmit': { en: "I've paid, submit", ta: 'செலுத்திவிட்டேன், சமர்ப்பி' },
  'pay.bankMissing': { en: 'Bank details are being updated. Call support before paying.', ta: 'வங்கி விவரங்கள் புதுப்பிக்கப்படுகின்றன. செலுத்தும் முன் உதவி மையத்தை அழையுங்கள்.' },
  'pay.receiptUploadFailed': { en: 'Could not upload the receipt. Try again or submit without it.', ta: 'ரசீதைப் பதிவேற்ற முடியவில்லை. மீண்டும் முயலுங்கள் அல்லது அது இல்லாமல் சமர்ப்பியுங்கள்.' },
} satisfies Record<string, Entry>;

export type MsgKey = keyof typeof MSG;

/** Translate a key. `{name}` placeholders are replaced from `vars`. Falls back to English. */
export function t(key: MsgKey, lang: Lang = 'en', vars?: Record<string, string | number>): string {
  const e = MSG[key] as Entry | undefined;
  let s = e ? e[lang] || e.en : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** "2 min" / "45 sec" in the chosen language. */
export function waitText(seconds: number, lang: Lang = 'en') {
  return seconds >= 60
    ? t('common.minutes', lang, { n: Math.ceil(seconds / 60) })
    : t('common.seconds', lang, { n: Math.max(1, Math.ceil(seconds)) });
}
