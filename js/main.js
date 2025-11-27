// Wait for full page load
window.addEventListener('load', function() {
    initializeBMC();
});

function initializeBMC() {
    // Create the BMC button HTML
    const bmcButtonHTML = `
        <a href="https://buymeacoffee.com/simwik91" target="_blank" class="super-bmc-btn">
            <img src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg" alt="Coffee cup">
            Buy me a coffee
        </a>
    `;

    // Show popup immediately
    if (!sessionStorage.getItem('bmcPopupShown')) {
        const popup = document.getElementById('bmc-popup');
        const popupButtonContainer = document.getElementById('bmc-popup-button-container');
        
        if (popup && popupButtonContainer) {
            // Add button to popup
            popupButtonContainer.innerHTML = bmcButtonHTML;
            
            setTimeout(() => {
                popup.style.display = 'flex';
                sessionStorage.setItem('bmcPopupShown', 'true');
            }, 1500);
        }
    } else {
        // If popup was already shown, initialize floating button immediately
        initializeFloatingButton();
    }

    // Close button functionality
    const closeButton = document.getElementById('bmc-popup-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            const popup = document.getElementById('bmc-popup');
            if (popup) {
                popup.style.display = 'none';
                initializeFloatingButton();
            }
        });
    }

    // Close popup when clicking outside
    const popup = document.getElementById('bmc-popup');
    if (popup) {
        popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                popup.style.display = 'none';
                initializeFloatingButton();
            }
        });
    }
}

function initializeFloatingButton() {
    const floatingContainer = document.getElementById('bmc-floating');
    
    // Clear any existing content
    floatingContainer.innerHTML = '';
    
    // Create centered floating button
    const floatingBtn = document.createElement('a');
    floatingBtn.href = 'https://buymeacoffee.com/simwik91';
    floatingBtn.target = '_blank';
    floatingBtn.className = 'centered-floating-bmc-btn';
    floatingBtn.innerHTML = `
        <img src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg" alt="Coffee cup">
        Buy me a coffee
    `;
    floatingBtn.title = 'Support my work';
    
    floatingContainer.appendChild(floatingBtn);
    
    // Show the floating container
    floatingContainer.style.display = 'block';
    
    console.log('Centered Buy Me a Coffee button initialized successfully');
}
// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// State
let state = {
  uploadedFiles: {},
  activeTab: 'merge',
  splitTotalPages: 0,
  pdfTotalPages: 0
};

// Initialize the application
function initialize() {
  // Set up tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Initialize file upload areas
  setupFileUpload('mergeUploadArea', 'mergeFileUpload', 'mergeFileList');
  setupFileUpload('splitUploadArea', 'splitFileUpload', 'splitFileList');
  setupFileUpload('compressUploadArea', 'compressFileUpload', 'compressFileList');
  setupFileUpload('convertUploadArea', 'convertFileUpload', 'convertFileList');

  // Clear buttons
  document.getElementById('clearMergeBtn').addEventListener('click', () => {
    state.uploadedFiles.mergeFileList = [];
    renderFileList('mergeFileList');
    hideMessages('merge');
    document.getElementById('mergeResult').style.display = 'none';
  });
  
  document.getElementById('clearSplitBtn').addEventListener('click', () => {
    state.uploadedFiles.splitFileList = [];
    renderFileList('splitFileList');
    document.getElementById('splitRange').value = '';
    state.splitTotalPages = 0;
    hideMessages('split');
    document.getElementById('splitResult').style.display = 'none';
    document.getElementById('totalPages').textContent = '-';
  });
  
  document.getElementById('clearCompressBtn').addEventListener('click', () => {
    state.uploadedFiles.compressFileList = [];
    renderFileList('compressFileList');
    hideMessages('compress');
    document.getElementById('compressResult').style.display = 'none';
    document.getElementById('compressProgressContainer').style.display = 'none';
  });
  
  document.getElementById('clearConvertBtn').addEventListener('click', () => {
    state.uploadedFiles.convertFileList = [];
    renderFileList('convertFileList');
    hideMessages('convert');
    document.getElementById('convertResult').style.display = 'none';
    document.getElementById('conversionDirection').textContent = 'Upload a file to begin';
    document.getElementById('pdfToImageSettings').style.display = 'none';
    document.getElementById('imageToPdfSettings').style.display = 'none';
  });
  
  // Process buttons
  document.getElementById('mergeBtn').addEventListener('click', processMerge);
  document.getElementById('splitBtn').addEventListener('click', processSplit);
  document.getElementById('compressBtn').addEventListener('click', processCompress);
  document.getElementById('convertBtn').addEventListener('click', processConvert);
  
  // Validate split range input
  const splitRangeInput = document.getElementById('splitRange');
  if (splitRangeInput) {
    splitRangeInput.addEventListener('input', () => {
      updateProcessButtonState('splitFileList');
    });
  }
}

// Switch tabs
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
  state.activeTab = tabName;
}

// Set up file upload areas
function setupFileUpload(areaId, inputId, listId) {
  const area = document.getElementById(areaId);
  const input = document.getElementById(inputId);
  
  area.addEventListener('click', () => input.click());
  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('drag-over');
  });
  area.addEventListener('dragenter', (e) => {
    e.preventDefault();
    area.classList.add('drag-over');
  });
  area.addEventListener('dragleave', () => {
    area.classList.remove('drag-over');
  });
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // For merge: append files instead of replacing
      if (listId === 'mergeFileList') {
        const existingFiles = state.uploadedFiles[listId] || [];
        const newFiles = Array.from(files);
        state.uploadedFiles[listId] = [...existingFiles, ...newFiles];
        renderFileList(listId);
      } else {
        input.files = files;
        handleFiles(input.files, listId);
      }
    }
  });
  
  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      // For merge: append files instead of replacing
      if (listId === 'mergeFileList') {
        const existingFiles = state.uploadedFiles[listId] || [];
        const newFiles = Array.from(input.files);
        state.uploadedFiles[listId] = [...existingFiles, ...newFiles];
        renderFileList(listId);
      } else {
        handleFiles(input.files, listId);
      }
    }
  });
}

// Render file list (for merge specifically)
function renderFileList(listId) {
  const list = document.getElementById(listId);
  const files = state.uploadedFiles[listId] || [];
  list.innerHTML = '';
  
  files.forEach((file, i) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    // Determine file icon
    let fileIcon = 'fa-file';
    if (file.type === 'application/pdf') {
      fileIcon = 'fa-file-pdf';
    } else if (file.type.startsWith('image/')) {
      fileIcon = 'fa-file-image';
    }
    
    fileItem.innerHTML = `
      <div class="file-info">
        <div class="file-icon"><i class="fas ${fileIcon}"></i></div>
        <div>
          <div>${file.name}</div>
          <div class="file-size">${formatFileSize(file.size)}</div>
        </div>
      </div>
      <div class="file-remove" data-index="${i}"><i class="fas fa-times"></i></div>
    `;
    list.appendChild(fileItem);
  });
  
  // Add remove functionality
  document.querySelectorAll(`#${listId} .file-remove`).forEach(removeBtn => {
    removeBtn.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      state.uploadedFiles[listId].splice(index, 1);
      renderFileList(listId);
      updateProcessButtonState(listId);
      
      // For conversion tab, reset direction if no files
      if (listId === 'convertFileList' && state.uploadedFiles[listId].length === 0) {
        document.getElementById('conversionDirection').textContent = 'Upload a file to begin';
        document.getElementById('pdfToImageSettings').style.display = 'none';
        document.getElementById('imageToPdfSettings').style.display = 'none';
      }
    });
  });
  
  updateProcessButtonState(listId);
}

// Handle uploaded files (for non-merge tabs)
function handleFiles(files, listId) {
  state.uploadedFiles[listId] = Array.from(files);
  renderFileList(listId);
  
  // For conversion tab, update the conversion direction
  if (listId === 'convertFileList' && files.length > 0) {
    updateConversionDirection(files[0]);
  }
  
  // For split tab, get total pages
  if (listId === 'splitFileList' && files.length > 0 && files[0].type === 'application/pdf') {
    getPDFPageCount(files[0]).then(pageCount => {
      state.splitTotalPages = pageCount;
      document.getElementById('totalPages').textContent = pageCount;
    }).catch(error => {
      console.error('Failed to get page count:', error);
      document.getElementById('totalPages').textContent = 'unknown';
    });
  }
}

// Get PDF page count
async function getPDFPageCount(file) {
  const { PDFDocument } = PDFLib;
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  return pdfDoc.getPageCount();
}

// Update conversion direction based on file type
async function updateConversionDirection(file) {
  const directionEl = document.getElementById('conversionDirection');
  
  if (file.type === 'application/pdf') {
    directionEl.innerHTML = '<i class="fas fa-file-pdf"></i> PDF → <i class="fas fa-file-image"></i> Image';
    directionEl.style.color = '#4361ee';
    
    // Get PDF page count
    const pageCount = await getPDFPageCount(file);
    state.pdfTotalPages = pageCount;
    
    // Update page selection dropdown
    const pageSelect = document.getElementById('pageSelection');
    pageSelect.innerHTML = '';
    for (let i = 1; i <= Math.min(pageCount, 10); i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `Page ${i}`;
      pageSelect.appendChild(option);
    }
    
    document.getElementById('pdfToImageSettings').style.display = 'block';
    document.getElementById('imageToPdfSettings').style.display = 'none';
  } else if (file.type.startsWith('image/')) {
    directionEl.innerHTML = '<i class="fas fa-file-image"></i> Image → <i class="fas fa-file-pdf"></i> PDF';
    directionEl.style.color = '#7209b7';
    document.getElementById('pdfToImageSettings').style.display = 'none';
    document.getElementById('imageToPdfSettings').style.display = 'block';
  } else {
    directionEl.textContent = 'Unsupported file type';
    directionEl.style.color = '#e74c3c';
    document.getElementById('pdfToImageSettings').style.display = 'none';
    document.getElementById('imageToPdfSettings').style.display = 'none';
  }
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Update process button state
function updateProcessButtonState(listId) {
  const tool = state.activeTab;
  const hasFiles = state.uploadedFiles[listId] && state.uploadedFiles[listId].length > 0;
  
  if (tool === 'merge') {
    document.getElementById('mergeBtn').disabled = !hasFiles || state.uploadedFiles[listId].length < 2;
  } else {
    document.getElementById(`${tool}Btn`).disabled = !hasFiles;
  }
  
  // For split tab, also require a valid range
  if (tool === 'split') {
    const rangeInput = document.getElementById('splitRange');
    const range = rangeInput.value.trim();
    const hasValidRange = range !== '' && validatePageRange(range, state.splitTotalPages);
    document.getElementById('splitBtn').disabled = !hasFiles || !hasValidRange;
  }
}

// Validate page range
function validatePageRange(rangeStr, totalPages) {
  if (!rangeStr) return false;
  
  const ranges = rangeStr.split(',');
  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(Number);
      if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
        return false;
      }
    } else {
      const page = parseInt(range.trim());
      if (isNaN(page) || page < 1 || page > totalPages) {
        return false;
      }
    }
  }
  return true;
}

// Show error message
function showError(tool, message) {
  const element = document.getElementById(`${tool}Error`);
  element.textContent = message;
  element.style.display = 'block';
  document.getElementById(`${tool}Loading`).style.display = 'none';
}

// Show success message
function showSuccess(tool, message) {
  const element = document.getElementById(`${tool}Success`);
  element.textContent = message;
  element.style.display = 'block';
  document.getElementById(`${tool}Loading`).style.display = 'none';
}

// Hide messages
function hideMessages(tool) {
  document.getElementById(`${tool}Error`).style.display = 'none';
  document.getElementById(`${tool}Success`).style.display = 'none';
}

// Show loading state
function showLoading(tool) {
  hideMessages(tool);
  document.getElementById(`${tool}Loading`).style.display = 'block';
  document.getElementById(`${tool}Result`).style.display = 'none';
}

// Hide loading state
function hideLoading(tool) {
  document.getElementById(`${tool}Loading`).style.display = 'none';
}

// Update progress bar
function updateProgress(tool, percent) {
  const percentValue = Math.min(100, Math.max(0, percent));
  if(tool === 'compress') {
    document.getElementById('compressProgressFill').style.width = `${percentValue}%`;
    document.getElementById('compressProgressPercent').textContent = `${Math.round(percentValue)}%`;
  }
}

// Create and download a file
function downloadFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Parse page range string
function parseRange(rangeStr, totalPages) {
  const pages = new Set();
  const ranges = rangeStr.split(',');
  
  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(Number);
      const min = Math.max(1, Math.min(start, end));
      const max = Math.min(totalPages, Math.max(start, end));
      
      for (let i = min; i <= max; i++) {
        pages.add(i - 1); // Convert to 0-indexed
      }
    } else {
      const page = parseInt(range.trim());
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pages.add(page - 1); // Convert to 0-indexed
      }
    }
  }
  
  return Array.from(pages).sort((a, b) => a - b);
}

// Process functions
async function processMerge() {
  const files = state.uploadedFiles.mergeFileList;
  if (!files || files.length < 2) {
    showError('merge', 'Please upload at least 2 PDF files to merge');
    return;
  }
  
  try {
    showLoading('merge');
    
    // Create a new PDF document
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();
    
    // Merge all PDFs
    for (const file of files) {
      const fileBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(fileBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }
    
    // Save merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    
    // Update UI
    const downloadLink = document.getElementById('mergeDownloadLink');
    downloadLink.onclick = () => downloadFile(blob, 'merged-document.pdf');
    document.getElementById('mergeResult').style.display = 'block';
    hideLoading('merge');
    showSuccess('merge', 'PDFs merged successfully!');
  } catch (error) {
    showError('merge', `Failed to merge PDFs: ${error.message}`);
  }
}

// Process Split PDF
async function processSplit() {
  const files = state.uploadedFiles.splitFileList;
  if (!files || files.length === 0) {
    showError('split', 'Please upload a PDF file to split');
    return;
  }
  
  const rangeInput = document.getElementById('splitRange').value.trim();
  if (!rangeInput) {
    showError('split', 'Please enter a valid page range');
    return;
  }
  
  if (!validatePageRange(rangeInput, state.splitTotalPages)) {
    showError('split', `Invalid page range. Please enter pages between 1 and ${state.splitTotalPages}`);
    return;
  }
  
  try {
    showLoading('split');
    
    const { PDFDocument } = PDFLib;
    const file = files[0];
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes);
    
    // Parse page range
    const pageIndices = parseRange(rangeInput, state.splitTotalPages);
    
    // Create new PDF with selected pages
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdfDoc, pageIndices);
    pages.forEach(page => newPdf.addPage(page));
    
    // Save new PDF
    const newPdfBytes = await newPdf.save();
    const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
    
    // Update UI
    const downloadLink = document.getElementById('splitDownloadLink');
    downloadLink.onclick = () => downloadFile(blob, `split-document-pages-${rangeInput.replace(/,/g, '-')}.pdf`);
    document.getElementById('splitResult').style.display = 'block';
    hideLoading('split');
    showSuccess('split', `PDF split successfully! Extracted ${pageIndices.length} pages.`);
  } catch (error) {
    showError('split', `Failed to split PDF: ${error.message}`);
  }
}

async function processCompress() {
  const files = state.uploadedFiles.compressFileList;
  if (!files || files.length === 0) {
    showError('compress', 'Please upload a PDF file to compress');
    return;
  }
  
  try {
    showLoading('compress');
    document.getElementById('compressProgressContainer').style.display = 'block';
    
    // Simulate compression progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      updateProgress('compress', progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, 200);
    
    // Load PDF document
    const file = files[0];
    const fileBytes = await file.arrayBuffer();
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.load(fileBytes);
    
    // Save as compressed PDF
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    const blob = new Blob([compressedBytes], { type: 'application/pdf' });
    
    // Calculate size reduction
    const originalSize = file.size;
    const compressedSize = blob.size;
    const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
    
    // Update UI
    document.getElementById('sizeReduction').textContent = `${reduction}%`;
    const downloadLink = document.getElementById('compressDownloadLink');
    downloadLink.onclick = () => downloadFile(blob, 'compressed-document.pdf');
    document.getElementById('compressResult').style.display = 'block';
    hideLoading('compress');
    showSuccess('compress', `PDF compressed successfully! Size reduced by ${reduction}%`);
  } catch (error) {
    showError('compress', `Failed to compress PDF: ${error.message}`);
  }
}

// Improved PDF conversion with PDF.js
async function processConvert() {
  const files = state.uploadedFiles.convertFileList;
  if (!files || files.length === 0) {
    showError('convert', 'Please upload a file to convert');
    return;
  }
  
  try {
    showLoading('convert');
    const file = files[0];
    let blob, fileName;
    
    if (file.type === 'application/pdf') {
      // Get selected page
      const pageNum = parseInt(document.getElementById('pageSelection').value);
      
      // Load the PDF with PDF.js
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Get the selected page
      const page = await pdf.getPage(pageNum);
      
      // Set scale (1.5 = 150% for better quality)
      const viewport = page.getViewport({ scale: 1.5 });
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      await page.render(renderContext).promise;
      
      // Convert canvas to JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const res = await fetch(dataUrl);
      blob = await res.blob();
      fileName = `converted-page-${pageNum}.jpg`;
    } else if (file.type.startsWith('image/')) {
      // Convert image to PDF
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      
      // Create image element to get dimensions
      const img = new Image();
      const imgUrl = URL.createObjectURL(file);
      
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imgUrl;
      });
      
      const width = img.width;
      const height = img.height;
      const ratio = width / height;
      
      // Calculate dimensions to fit in PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdfWidth / ratio;
      
      // Get quality setting
      const quality = document.getElementById('imageQuality').value;
      let qualityValue = 0.95;
      if (quality === 'medium') qualityValue = 0.75;
      if (quality === 'low') qualityValue = 0.5;
      
      // Add image to PDF
      pdf.addImage(img, 'JPEG', 0, 0, pdfWidth, pdfHeight, null, 'FAST', 0, qualityValue);
      blob = pdf.output('blob');
      fileName = 'converted-document.pdf';
      
      URL.revokeObjectURL(imgUrl);
    } else {
      showError('convert', 'Unsupported file type for conversion');
      return;
    }
    
    // Update UI
    const downloadLink = document.getElementById('convertDownloadLink');
    downloadLink.onclick = () => downloadFile(blob, fileName);
    document.getElementById('convertResult').style.display = 'block';
    hideLoading('convert');
    showSuccess('convert', 'File converted successfully!');
  } catch (error) {
    showError('convert', `Failed to convert file: ${error.message}`);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);