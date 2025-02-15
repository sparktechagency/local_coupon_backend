// Parse date from dd/mm/yyyy to yyyy-mm-dd
const parseDate = (dateStr: string): Date | null => {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const formattedDate = new Date(`${year}-${month}-${day}`);
  return isNaN(formattedDate.getTime()) ? null : formattedDate;
};

export default parseDate;
