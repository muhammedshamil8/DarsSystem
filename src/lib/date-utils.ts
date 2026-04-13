import hijriConverter from 'hijri-converter';

export function getHijriDate(date: Date = new Date()) {
  const hijri = hijriConverter.toHijri(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  
  const months = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Ula', 'Jumada al-Akhira', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ];

  return `${hijri.hy} ${months[hijri.hm - 1]} ${hijri.hd}`;
}

export function formatDate(date: Date = new Date()) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
