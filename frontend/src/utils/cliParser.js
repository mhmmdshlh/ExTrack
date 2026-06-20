const TEMPLATE_ORDER = {
  '{amount}': 'amount',
  '{harga}': 'amount',
  '{nominal}': 'amount',
  '{title}': 'title',
  '{nama}': 'title',
  '{category}': 'category',
  '{kategori}': 'category',
  '{notes}': 'notes',
  '{catatan}': 'notes',
};

export function parseCLIInput(input, template) {
  const result = { title: '', amount: 0, category: '', notes: '', dateInput: '', timeInput: '' };

  if (!input || !template) return result;

  const templateParts = template.split(/\s+/);
  const allParts = input.trim().split(/\s+/);

  let dateInput = '';
  let timeInput = '';
  const inputParts = [];
  for (let i = 0; i < allParts.length; i++) {
    if (allParts[i] === '--date' && i + 1 < allParts.length) {
      dateInput = allParts[++i];
    } else if (allParts[i] === '--time' && i + 1 < allParts.length) {
      timeInput = allParts[++i];
    } else {
      inputParts.push(allParts[i]);
    }
  }

  const fieldNames = templateParts.map(tpl => TEMPLATE_ORDER[tpl] || null);

  let inputIdx = 0;

  for (let i = 0; i < templateParts.length && inputIdx < inputParts.length; i++) {
    const key = fieldNames[i];

    if (!key) {
      inputIdx++;
      continue;
    }

    if (key === 'amount') {
      const num = parseInt(inputParts[inputIdx]?.replace(/[^0-9]/g, '')) || 0;
      result.amount = num;
      inputIdx++;
    } else if (key === 'category') {
      result.category = inputParts[inputIdx] || '';
      inputIdx++;
    } else if (key === 'title') {
      const remainingFields = fieldNames.slice(i + 1).filter(Boolean);
      const reserved = remainingFields.filter(f => f !== 'title' && f !== 'notes').length;
      const wordCount = Math.max(1, inputParts.length - inputIdx - reserved);
      result.title = inputParts.slice(inputIdx, inputIdx + wordCount).join(' ');
      inputIdx += wordCount;
    } else if (key === 'notes') {
      const remainingFields = fieldNames.slice(i + 1).filter(Boolean);
      const reserved = remainingFields.filter(f => f !== 'notes').length;
      const wordCount = Math.max(1, inputParts.length - inputIdx - reserved);
      result.notes = inputParts.slice(inputIdx, inputIdx + wordCount).join(' ');
      inputIdx += wordCount;
    }
  }

  result.dateInput = dateInput;
  result.timeInput = timeInput;
  return result;
}

export function previewFromCLI(input, template) {
  return parseCLIInput(input, template);
}

const PLACEHOLDER_SAMPLES = {
  amount: '15000',
  title: 'nasi goreng',
  category: 'makanan',
  notes: 'catatan',
};

export function getCLIPlaceholder(template) {
  if (!template) return '15000 nasi goreng makanan';
  const parts = template.split(/\s+/);
  const sample = parts.map((p) => {
    const key = TEMPLATE_ORDER[p];
    return PLACEHOLDER_SAMPLES[key] || p;
  });
  return sample.join(' ');
}
