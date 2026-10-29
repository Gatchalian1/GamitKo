/* =====================================================
   GRC GamitKo
   script.js - shared JavaScript for all the pages

   The pages do not keep their own data. They ask the PHP
   files inside the "api" folder, and those files talk to
   the MySQL database.
   ===================================================== */

// The account of the person who is logged in right now.
var currentUser = null;

// Used on the "report an item" page.
var reportType = 'lost';      // "lost" or "found"
var reportPhotoFile = null;   // the photo file the user chose

// The item that is being claimed right now.
var currentItemId = '';


/* ---------- talking to the PHP files ---------- */

// Send a request to a PHP file and give back the JSON answer.

async function sendRequest(script, fields) {
    var body = fields instanceof FormData
        ? fields
        : buildFormData(fields);

    var response = await fetch('api/' + script, {
        method: 'POST',
        body: body
    });

    var data = await response.json();

    // Fix the raw array returned by items.php
    if (script === 'items.php' && Array.isArray(data)) {
        return { items: data };
    }

    return data;
}


// Turn plain values into FormData so the PHP files can read them.
function buildFormData(fields) {
  var formData = new FormData();
  for (var key in fields) {
    formData.append(key, fields[key]);
  }
  return formData;
}


/* ---------- small helpers ---------- */

// Today's date in the format the database uses (YYYY-MM-DD).
function todayString() {
  return new Date().toISOString().slice(0, 10);
}

// Make a database date look nice, for example "Oct 11, 2026".
function formatDate(dateText) {
  if (!dateText) {
    return '-';
  }
  var parts = String(dateText).slice(0, 10).split('-');
  if (parts.length !== 3) {
    return dateText;
  }
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(parts[1], 10) - 1] + ' ' +
         parseInt(parts[2], 10) + ', ' + parts[0];
}

// First two letters of a name, shown inside the round avatar.
function getInitials(name) {
  var words = String(name || '?').trim().split(' ');
  var result = '';
  for (var i = 0; i < words.length && i < 2; i++) {
    result += words[i].charAt(0).toUpperCase();
  }
  return result;
}

// Keep text safe before placing it inside HTML.
function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// A coloured label for a status (open, matched, ...) or a type (lost/found).
function statusBadge(status) {
  return '<span class="badge badge-' + status + '">' +
         status.toUpperCase() + '</span>';
}

function typeBadge(type) {
  return '<span class="badge badge-' + type + '">' +
         type.toUpperCase() + '</span>';
}

// Show or hide a small message box under a form.
function showMessage(boxId, text) {
  var box = document.getElementById(boxId);
  if (box) {
    box.textContent = text;
    box.classList.add('show');
  }
}

function hideMessage(boxId) {
  var box = document.getElementById(boxId);
  if (box) {
    box.classList.remove('show');
  }
}

// Switch between the pages of a portal (dashboard, found, ...).
function goToPage(pageName) {
  var sections = document.querySelectorAll('[id^="page-"]');
  for (var i = 0; i < sections.length; i++) {
    sections[i].classList.add('hidden');
  }

  var target = document.getElementById('page-' + pageName);
  if (target) {
    target.classList.remove('hidden');
  }

  var links = document.querySelectorAll('.nav-link');
  for (var j = 0; j < links.length; j++) {
    if (links[j].getAttribute('data-page') === pageName) {
      links[j].classList.add('active');
    } else {
      links[j].classList.remove('active');
    }
  }

  window.scrollTo(0, 0);
}

// Log out and go back to the login page.
function logout() {
  sendRequest('auth.php', { action: 'logout' }).then(function () {
    currentUser = null;
    window.location.href = 'index.html';
  });
}


/* =====================================================
   LOGIN PAGE (index.html)
   ===================================================== */

function startLoginPage() {
  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');
  var loginButton = document.getElementById('showLogin');
  var registerButton = document.getElementById('showRegister');

  // The two tabs on top of the card.
  loginButton.onclick = function () {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginButton.classList.add('active');
    registerButton.classList.remove('active');
  };

  registerButton.onclick = function () {
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    registerButton.classList.add('active');
    loginButton.classList.remove('active');
  };

  // ---- login ----
  loginForm.onsubmit = async function (event) {
    event.preventDefault();
    hideMessage('loginError');

    var email = document.getElementById('loginEmail').value.trim().toLowerCase();
    var password = document.getElementById('loginPassword').value;

    if (email === '' || password === '') {
      showMessage('loginError', 'Please type your email and password.');
      return;
    }

    var result = await sendRequest('auth.php', {
      action: 'login',
      email: email,
      password: password
    });

    if (result.ok !== true) {
      showMessage('loginError', result.error);
      return;
    }

    currentUser = result.user;

    if (currentUser.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'student.html';
    }
  };

  // ---- register ----
  registerForm.onsubmit = async function (event) {
    event.preventDefault();
    hideMessage('registerError');

    var name = document.getElementById('regName').value.trim();
    var studentId = document.getElementById('regId').value.trim();
    var course = document.getElementById('regCourse').value.trim();
    var email = document.getElementById('regEmail').value.trim().toLowerCase();
    var password = document.getElementById('regPassword').value;

    if (name === '' || studentId === '' || course === '' ||
        email === '' || password === '') {
      showMessage('registerError', 'Please fill up all the fields.');
      return;
    }
    if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
      showMessage('registerError', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 5) {
      showMessage('registerError', 'Password must be at least 5 characters.');
      return;
    }

    var result = await sendRequest('auth.php', {
      action: 'register',
      name: name,
      student_id: studentId,
      course: course,
      email: email,
      password: password
    });

    if (result.ok !== true) {
      showMessage('registerError', result.error);
      return;
    }

    currentUser = result.user;
    window.location.href = 'student.html';
  };
}


/* =====================================================
   STUDENT PORTAL (student.html)
   ===================================================== */

async function startStudentPage() {
  // Ask PHP who is logged in.
  var result = await sendRequest('auth.php', { action: 'me' });

  if (result.ok !== true || !result.user) {
    window.location.replace('index.html');
    return;
  }

  currentUser = result.user;

  if (currentUser.role !== 'student') {
    window.location.replace('index.html');
    return;
  }

  // Name and avatar on the sidebar and dashboard.
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userAvatar').textContent = getInitials(currentUser.name);
  document.getElementById('welcomeTitle').textContent = 'Welcome, ' + currentUser.name + '!';

  // Default values for the report form.
  document.getElementById('itemContact').value = currentUser.email;
  document.getElementById('itemDate').value = todayString();

  // Sidebar links.
  var links = document.querySelectorAll('.nav-link');
  for (var i = 0; i < links.length; i++) {
    links[i].onclick = function (event) {
      event.preventDefault();
      var page = this.getAttribute('data-page');
      goToPage(page);

      if (page === 'dashboard') { loadStudentDashboard(); }
      if (page === 'found') { loadFoundItems(); }
      if (page === 'reports') { loadMyReports(); }
    };
  }

  // Search and filter on the found items page.
  document.getElementById('searchFound').oninput = loadFoundItems;
  document.getElementById('filterCategory').onchange = loadFoundItems;

  // Photo picker on the report page.
  document.getElementById('itemPhoto').onchange = function () {
    pickPhoto(this);
  };

  // Report form.
  document.getElementById('itemReportForm').onsubmit = function (event) {
    event.preventDefault();
    saveItemReport();
  };

  loadStudentDashboard();
}

// ---- student dashboard ----
async function loadStudentDashboard() {
  var itemsResult = await sendRequest('items.php', { action: 'listAll' });
  var items = itemsResult.items || [];

  // How many reports did this student send?
  var myReports = 0;
  for (var i = 0; i < items.length; i++) {
    if (Number(items[i].reporterId) === Number(currentUser.id)) {
      myReports++;
    }
  }
  document.getElementById('statLost').textContent = myReports;

  // Latest found items that were not returned yet.
  var found = [];
  for (var j = 0; j < items.length; j++) {
    if (items[j].type === 'found' && items[j].status !== 'returned') {
      found.push(items[j]);
    }
  }
  found.sort(function (a, b) {
    return new Date(b.dateAdded) - new Date(a.dateAdded);
  });

  var box = document.getElementById('latestItems');
  if (found.length === 0) {
    box.innerHTML = '<div class="empty-box"><div class="big">&#128230;</div>' +
                    '<p>No items found yet.</p></div>';
  } else {
    var html = '';
    for (var k = 0; k < found.length && k < 3; k++) {
      html += buildItemCard(found[k]);
    }
    box.innerHTML = html;
  }

  // My claim counts.
  var claimsResult = await sendRequest('claims.php', { action: 'myClaims' });
  var claims = claimsResult.claims || [];

  var myClaims = 0;
  var pending = 0;
  var recovered = 0;
  for (var n = 0; n < claims.length; n++) {
    myClaims++;
    if (claims[n].status === 'pending') { pending++; }
    if (claims[n].status === 'approved') { recovered++; }
  }

  document.getElementById('statClaims').textContent = myClaims;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statRecovered').textContent = recovered;
}

// ---- the "I lost an item" / "I found an item" buttons ----
function setReportType(type) {
  reportType = type;

  if (type === 'found') {
    document.getElementById('typeFound').classList.add('active');
    document.getElementById('typeLost').classList.remove('active');
    document.getElementById('locationLabel').textContent = 'Where did you find it? *';
    document.getElementById('dateLabel').textContent = 'Date found *';
  } else {
    document.getElementById('typeLost').classList.add('active');
    document.getElementById('typeFound').classList.remove('active');
    document.getElementById('locationLabel').textContent = 'Where did you lose it? *';
    document.getElementById('dateLabel').textContent = 'Date lost *';
  }

  hideMessage('reportOk');
  hideMessage('reportError');
}

// ---- reading the photo the user chose ----
function pickPhoto(input) {
  var file = input.files[0];
  if (!file) {
    return;
  }
  if (file.type.indexOf('image/') !== 0) {
    alert('Please choose an image file (jpg or png).');
    input.value = '';
    return;
  }

  reportPhotoFile = file;

  makePhotoSmall(file, function (dataUrl) {
    if (dataUrl === '') {
      return;
    }
    document.getElementById('photoPreview').src = dataUrl;
    document.getElementById('photoPreview').classList.remove('hidden');
    document.getElementById('removePhoto').classList.remove('hidden');
  });
}

// Phone photos are very big, so we shrink them before sending.
function makePhotoSmall(file, done) {
  var reader = new FileReader();

  reader.onload = function (event) {
    var dataUrl = event.target.result;
    var image = new Image();

    image.onload = function () {
      var maxSide = 640;
      var width = image.width;
      var height = image.height;

      if (width >= height && width > maxSide) {
        height = Math.round(height * maxSide / width);
        width = maxSide;
      } else if (height > maxSide) {
        width = Math.round(width * maxSide / height);
        height = maxSide;
      }

      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      done(canvas.toDataURL('image/jpeg', 0.7));
    };

    image.onerror = function () { done(dataUrl); };
    image.src = dataUrl;
  };

  reader.onerror = function () { done(''); };
  reader.readAsDataURL(file);
}

// Remove the photo that was chosen before sending.
function clearPhoto() {
  reportPhotoFile = null;
  document.getElementById('itemPhoto').value = '';
  document.getElementById('photoPreview').classList.add('hidden');
  document.getElementById('removePhoto').classList.add('hidden');
}

// Clear the report form after it was sent.
function clearReportForm() {
  document.getElementById('itemReportForm').reset();

  if (currentUser) {
    document.getElementById('itemContact').value = currentUser.email;
  }
  document.getElementById('itemDate').value = todayString();

  clearPhoto();
}

// ---- send a lost or found report ----
async function saveItemReport() {
  hideMessage('reportOk');
  hideMessage('reportError');

  var name = document.getElementById('itemName').value.trim();
  var category = document.getElementById('itemCategory').value;
  var location = document.getElementById('itemLocation').value;
  var date = document.getElementById('itemDate').value;
  var contact = document.getElementById('itemContact').value.trim();
  var description = document.getElementById('itemDescription').value.trim();

  if (name === '' || category === '' || location === '' ||
      date === '' || contact === '' || description === '') {
    showMessage('reportError', 'Please complete all the required fields.');
    return;
  }
  if (description.length < 10) {
    showMessage('reportError', 'Please describe the item a little more (at least 10 characters).');
    return;
  }

  var formData = buildFormData({
    action: 'add',
    type: reportType,
    name: name,
    category: category,
    location: location,
    item_date: date,
    description: description,
    contact: contact
  });

  // The photo is optional, so only send it when one was chosen.
  if (reportPhotoFile !== null) {
    formData.append('photo', reportPhotoFile, reportPhotoFile.name);
  }

  var result = await sendRequest('items.php', formData);
  if (result.ok !== true) {
    showMessage('reportError', result.error);
    return;
  }

  var wasLost = (reportType === 'lost');
  clearReportForm();

  if (wasLost) {
    showMessage('reportOk', 'Your lost item report was submitted. The office will contact you if your item is found.');
  } else {
    showMessage('reportOk', 'Thank you for turning in the item. Please bring it to the OSA office.');
  }

  loadStudentDashboard();
}

// ---- the cards on the found items list ----
function buildItemCard(item) {
  var photo = '';
  if (item.photo) {
    photo = '<img class="item-photo" src="' + item.photo + '" alt="Item photo">';
  }

  var action = '';
  if (currentUser && Number(item.reporterId) === Number(currentUser.id)) {
    action = '<span class="small">Your report</span>';
  } else if (item.status === 'open' || item.status === 'matched') {
    action = '<button class="btn btn-main btn-small" onclick="openClaimModal(\'' + item.id + '\')">Claim this item</button>';
  } else {
    action = '<span class="badge badge-returned">Already claimed</span>';
  }

  return '<div class="item-card">' +
    photo +
    '<h3>' + escapeHtml(item.name) + '</h3>' +
    '<p class="meta">Category: ' + escapeHtml(item.category) + '</p>' +
    '<p class="meta">Found at: ' + escapeHtml(item.location) + '</p>' +
    '<p class="meta">Date found: ' + formatDate(item.itemDate) + '</p>' +
    '<p class="meta" style="margin-top:8px;">' + escapeHtml(item.description) + '</p>' +
    '<div class="footer">' +
      statusBadge(item.status) +
      action +
    '</div>' +
  '</div>';
}

// ---- found items list ----
async function loadFoundItems() {
  var search = document.getElementById('searchFound').value.toLowerCase();
  var category = document.getElementById('filterCategory').value;

  var result = await sendRequest('items.php', { action: 'listFound' });
  var items = result.items || [];

  var results = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (category !== '' && item.category !== category) {
      continue;
    }
    var text = (item.name + ' ' + item.location + ' ' + item.description).toLowerCase();
    if (search !== '' && text.indexOf(search) === -1) {
      continue;
    }
    results.push(item);
  }

  var listBox = document.getElementById('foundList');
  var emptyBox = document.getElementById('foundEmpty');

  if (results.length === 0) {
    listBox.innerHTML = '';
    emptyBox.classList.remove('hidden');
    return;
  }

  emptyBox.classList.add('hidden');
  var html = '';
  for (var j = 0; j < results.length; j++) {
    html += buildItemCard(results[j]);
  }
  listBox.innerHTML = html;
}

// ---- my reports and my claims ----
async function loadMyReports() {
  var reportsBody = document.getElementById('myReportsTable');
  var reportsEmpty = document.getElementById('myReportsEmpty');
  var claimsBody = document.getElementById('myClaimsTable');
  var claimsEmpty = document.getElementById('myClaimsEmpty');

  // My item reports (lost and found).
  var itemsResult = await sendRequest('items.php', { action: 'listAll' });
  var items = itemsResult.items || [];
  var rows = '';

  for (var i = 0; i < items.length; i++) {
    if (Number(items[i].reporterId) !== Number(currentUser.id)) {
      continue;
    }
    rows += '<tr>' +
      '<td>' + escapeHtml(items[i].name) + '</td>' +
      '<td>' + typeBadge(items[i].type) + '</td>' +
      '<td>' + escapeHtml(items[i].category) + '</td>' +
      '<td>' + escapeHtml(items[i].location) + '</td>' +
      '<td>' + formatDate(items[i].itemDate) + '</td>' +
      '<td>' + statusBadge(items[i].status) + '</td>' +
    '</tr>';
  }

  if (rows === '') {
    reportsBody.innerHTML = '';
    reportsEmpty.classList.remove('hidden');
  } else {
    reportsBody.innerHTML = rows;
    reportsEmpty.classList.add('hidden');
  }

  // My claim requests.
  var claimsResult = await sendRequest('claims.php', { action: 'myClaims' });
  var claims = claimsResult.claims || [];
  var claimRows = '';

  for (var j = 0; j < claims.length; j++) {
    claimRows += '<tr>' +
      '<td>' + escapeHtml(claims[j].itemName || 'Unknown item') + '</td>' +
      '<td>' + escapeHtml(claims[j].message) + '</td>' +
      '<td>' + formatDate(claims[j].dateSent) + '</td>' +
      '<td>' + statusBadge(claims[j].status) + '</td>' +
      '<td>' + (claims[j].note ? escapeHtml(claims[j].note) : '-') + '</td>' +
    '</tr>';
  }

  if (claimRows === '') {
    claimsBody.innerHTML = '';
    claimsEmpty.classList.remove('hidden');
  } else {
    claimsBody.innerHTML = claimRows;
    claimsEmpty.classList.add('hidden');
  }
}

// ---- claim modal ----
async function openClaimModal(itemId) {
  var result = await sendRequest('items.php', { action: 'getItem', item_id: itemId });
  if (result.ok !== true) {
    return;
  }
  var item = result.item;

  if (Number(item.reporterId) === Number(currentUser.id)) {
    alert('You are the one who reported this item, so you cannot claim it.');
    return;
  }

  currentItemId = itemId;
  document.getElementById('claimItemName').textContent =
    'Item: ' + item.name + ' (found at ' + item.location + ')';
  document.getElementById('claimMessage').value = '';
  hideMessage('claimError');
  document.getElementById('claimModal').classList.remove('hidden');
}

function closeClaimModal() {
  document.getElementById('claimModal').classList.add('hidden');
}

async function submitClaim() {
  hideMessage('claimError');

  var message = document.getElementById('claimMessage').value.trim();
  if (message.length < 10) {
    showMessage('claimError', 'Please explain why the item is yours (at least 10 characters).');
    return;
  }

  var result = await sendRequest('claims.php', {
    action: 'send',
    item_id: currentItemId,
    message: message
  });

  if (result.ok !== true) {
    showMessage('claimError', result.error);
    return;
  }

  closeClaimModal();
  alert('Your claim was submitted. Please wait for the office to review it.');
  loadFoundItems();
}


/* =====================================================
   ADMIN PORTAL (admin.html)
   ===================================================== */

async function startAdminPage() {
  // Ask PHP who is logged in.
  var result = await sendRequest('auth.php', { action: 'me' });

  if (result.ok !== true || !result.user) {
    window.location.replace('index.html');
    return;
  }

  currentUser = result.user;

  if (currentUser.role !== 'admin') {
    window.location.replace('student.html');
    return;
  }

  // Show the admin's name.
  document.getElementById('adminName').textContent = currentUser.name;
  document.getElementById('adminAvatar').textContent = getInitials(currentUser.name);
  document.getElementById('adminWelcome').textContent = 'Welcome, ' + currentUser.name + '!';

  document.getElementById('fDate').value = todayString();

  // Sidebar links.
  var links = document.querySelectorAll('.nav-link');
  for (var i = 0; i < links.length; i++) {
    links[i].onclick = function (event) {
      event.preventDefault();
      var page = this.getAttribute('data-page');
      goToPage(page);

      if (page === 'dashboard') { loadAdminDashboard(); }
      if (page === 'found') { loadAdminFoundItems(); }
      if (page === 'lost') { loadAdminLostReports(); }
      if (page === 'claims') { loadAdminClaims(); }
      if (page === 'students') { loadAdminStudents(); }
    };
  }

  // Add found item form.
  document.getElementById('foundForm').onsubmit = function (event) {
    event.preventDefault();
    submitAdminFoundItem();
  };

  // Clear the photo preview when the form is reset.
  document.getElementById('foundForm').onreset = function () {
    clearPhoto();
  };

  // Photo picker on the form.
  document.getElementById('itemPhoto').onchange = function () {
    pickPhoto(this);
  };

  document.getElementById('searchAdminLost').oninput = loadAdminLostReports;
  document.getElementById('searchAdminFound').oninput = loadAdminFoundItems;

  loadAdminDashboard();
}

// ---- admin dashboard ----
async function loadAdminDashboard() {
  var result = await sendRequest('items.php', { action: 'listAll' });
  var items = result.items || [];

  var lost = 0;
  var found = 0;
  var returned = 0;

  for (var i = 0; i < items.length; i++) {
    if (items[i].type === 'lost') { lost++; }
    if (items[i].type === 'found') { found++; }
    if (items[i].status === 'returned') { returned++; }
  }

  document.getElementById('statLostItems').textContent = lost;
  document.getElementById('statFoundItems').textContent = found;
  document.getElementById('statReturnedItems').textContent = returned;

  loadDashboardPendingClaims();
}

// The pending claims table on the dashboard.
async function loadDashboardPendingClaims() {
  var table = document.getElementById('dashboardClaims');
  var emptyBox = document.getElementById('dashboardClaimsEmpty');
  var countBox = document.getElementById('statPendingClaims');

  var result = await sendRequest('claims.php', { action: 'allClaims' });
  var claims = result.claims || [];

  // Keep only the claims that are still waiting for a decision.
  var pending = [];
  for (var i = 0; i < claims.length; i++) {
    if (claims[i].status === 'pending') {
      pending.push(claims[i]);
    }
  }

  countBox.textContent = pending.length;

  if (pending.length === 0) {
    table.innerHTML = '';
    emptyBox.classList.remove('hidden');
    return;
  }

  emptyBox.classList.add('hidden');

  var rows = '';
  for (var j = 0; j < pending.length && j < 5; j++) {
    rows += '<tr>' +
      '<td>' + escapeHtml(pending[j].itemName || 'Unknown item') + '</td>' +
      '<td>' + escapeHtml(pending[j].studentName || 'Unknown student') + '</td>' +
      '<td>' + formatDate(pending[j].dateSent) + '</td>' +
      '<td><button type="button" class="btn btn-outline btn-small" ' +
        'onclick="openAdminClaimsFromDashboard()">Review claims</button></td>' +
    '</tr>';
  }
  table.innerHTML = rows;
}

// Open the full claims page from the dashboard.
function openAdminClaimsFromDashboard() {
  goToPage('claims');
  loadAdminClaims();
}

// ---- found items table ----
async function loadAdminFoundItems() {
  var result = await sendRequest('items.php', { action: 'listFound' });
  var items = result.items || [];
  var search = document.getElementById('searchAdminFound').value.trim().toLowerCase();
  var rows = '';

  for (var i = 0; i < items.length; i++) {
    var item = items[i];

    var text = (item.name + ' ' + item.category + ' ' + item.location).toLowerCase();
    if (search !== '' && text.indexOf(search) === -1) {
      continue;
    }

    var button = '';
    if (item.status === 'returned') {
      button = '<button class="btn btn-outline btn-small" onclick="adminSetItemStatus(' +
        item.id + ', \'open\')">Reopen</button>';
    } else {
      button = '<button class="btn btn-main btn-small" onclick="adminSetItemStatus(' +
        item.id + ', \'returned\')">Mark returned</button>';
    }

    // Show the photo (if there is one) inside the item cell.
    var photo = '';
    if (item.photo) {
      photo = '<img class="thumb" src="' + item.photo.split(',')[0] + '" alt="Item photo">';
    }

    rows += '<tr>' +
      '<td>' + photo + escapeHtml(item.name) + '</td>' +
      '<td>' + escapeHtml(item.category) + '</td>' +
      '<td>' + escapeHtml(item.location) + '</td>' +
      '<td>' + formatDate(item.itemDate) + '</td>' +
      '<td>' + statusBadge(item.status) + '</td>' +
      '<td>' + button + '</td>' +
    '</tr>';
  }

  document.getElementById('foundTable').innerHTML = rows;

  var empty = document.getElementById('foundTableEmpty');
  if (rows === '') {
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
  }
}

// ---- lost reports table ----
async function loadAdminLostReports() {
  var result = await sendRequest('items.php', { action: 'listLost' });
  var items = result.items || [];
  var search = document.getElementById('searchAdminLost').value.trim().toLowerCase();
  var rows = '';

  for (var i = 0; i < items.length; i++) {
    var item = items[i];

    var text = (item.name + ' ' + item.reporter + ' ' +
                (item.contact || '') + ' ' + item.location).toLowerCase();
    if (search !== '' && text.indexOf(search) === -1) {
      continue;
    }

    var button = '';
    if (item.status === 'matched') {
      button = '<button class="btn btn-outline btn-small" onclick="adminSetItemStatus(' +
        item.id + ', \'open\')">Reopen</button>';
    } else {
      button = '<button class="btn btn-main btn-small" onclick="adminSetItemStatus(' +
        item.id + ', \'matched\')">Mark matched</button>';
    }

    // Show the photo (if there is one) inside the item cell.
    var photo = '';
    if (item.photo) {
      photo = '<img class="thumb" src="' + item.photo.split(',')[0] + '" alt="Item photo">';
    }

    rows += '<tr>' +
      '<td>' + photo + escapeHtml(item.name) + '</td>' +
      '<td>' + escapeHtml(item.reporter) + '</td>' +
      '<td>' + escapeHtml(item.contact || '-') + '</td>' +
      '<td>' + escapeHtml(item.location) + '</td>' +
      '<td>' + statusBadge(item.status) + '</td>' +
      '<td>' + button + '</td>' +
    '</tr>';
  }

  document.getElementById('lostTable').innerHTML = rows;

  var empty = document.getElementById('lostTableEmpty');
  if (rows === '') {
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
  }
}

// ---- change the status of a report ----
async function adminSetItemStatus(itemId, status) {
  var result = await sendRequest('items.php', {
    action: 'setStatus',
    item_id: itemId,
    status: status
  });

  if (result.ok !== true) {
    alert(result.error);
    return;
  }

  loadAdminDashboard();
  loadAdminFoundItems();
  loadAdminLostReports();
}

// ---- add a found item ----
async function submitAdminFoundItem() {
  hideMessage('addItemOk');
  hideMessage('addItemError');

  var name = document.getElementById('fName').value.trim();
  var category = document.getElementById('fCategory').value;
  var location = document.getElementById('fLocation').value;
  var date = document.getElementById('fDate').value;
  var description = document.getElementById('fDescription').value.trim();

  if (name === '' || category === '' || location === '' ||
      date === '' || description === '') {
    showMessage('addItemError', 'Please complete all the required fields.');
    return;
  }

  var formData = buildFormData({
    action: 'add',
    type: 'found',
    name: name,
    category: category,
    location: location,
    item_date: date,
    description: description,
    contact: currentUser.email
  });

  if (reportPhotoFile !== null) {
    formData.append('photo', reportPhotoFile, reportPhotoFile.name);
  }

  var result = await sendRequest('items.php', formData);
  if (result.ok !== true) {
    showMessage('addItemError', result.error);
    return;
  }

  document.getElementById('foundForm').reset();
  document.getElementById('fDate').value = todayString();
  showMessage('addItemOk', 'The found item was saved.');

  loadAdminFoundItems();
  loadAdminDashboard();
}

// ---- claims table ----
async function loadAdminClaims() {
  var result = await sendRequest('claims.php', { action: 'allClaims' });
  var claims = result.claims || [];
  var rows = '';

  for (var i = 0; i < claims.length; i++) {
    var claim = claims[i];
    var buttons = '';

    if (claim.status === 'pending') {
      buttons = '<button class="btn btn-main btn-small" onclick="decideAdminClaim(' +
        claim.id + ', \'approved\')">Approve</button> ' +
        '<button class="btn btn-outline btn-small" onclick="decideAdminClaim(' +
        claim.id + ', \'rejected\')">Reject</button>';
    } else {
      buttons = 'Already reviewed';
    }

    rows += '<tr>' +
      '<td>' + escapeHtml(claim.itemName || 'Unknown item') + '</td>' +
      '<td>' + escapeHtml(claim.studentName || 'Unknown student') + '</td>' +
      '<td>' + escapeHtml(claim.message) + '</td>' +
      '<td>' + formatDate(claim.dateSent) + '</td>' +
      '<td>' + escapeHtml(claim.status) + '</td>' +
      '<td>' + buttons + '</td>' +
    '</tr>';
  }

  document.getElementById('claimsTable').innerHTML = rows;

  var empty = document.getElementById('claimsTableEmpty');
  if (rows === '') {
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
  }
}

// Approve or reject a claim.
async function decideAdminClaim(claimId, decision) {
  var defaultNote = 'Claim approved. Please get your item at the OSA office.';
  if (decision === 'rejected') {
    defaultNote = 'Sorry, the proof of ownership was not enough.';
  }

  var note = prompt('Add a note for the student:', defaultNote);
  if (note === null) {
    return;
  }

  var result = await sendRequest('claims.php', {
    action: 'decide',
    claim_id: claimId,
    decision: decision,
    note: note
  });

  if (result.ok !== true) {
    alert(result.error);
    return;
  }

  loadAdminClaims();
  loadAdminDashboard();
}

// ---- students table ----
async function loadAdminStudents() {
  var result = await sendRequest('users.php', { action: 'listStudents' });
  var students = result.students || [];
  var rows = '';

  for (var i = 0; i < students.length; i++) {
    var student = students[i];
    var nextStatus = student.status === 'active' ? 'inactive' : 'active';
    var label = nextStatus === 'inactive' ? 'Delete' : 'Activate';

    rows += '<tr>' +
  '<td>' + escapeHtml(student.name) + '</td>' +
  '<td>' + escapeHtml(student.studentId) + '</td>' +
  '<td>' + escapeHtml(student.course) + '</td>' +
  '<td>' + escapeHtml(student.email) + '</td>' +
  '<td>' + statusBadge(student.status) + '</td>' +
  '<td>' +
    '<div class="action-buttons">' +
      '<button class="btn btn-outline btn-small" onclick="openEditStudentModal(' + student.id + ')">Edit</button>' +
      '<button class="btn btn-outline btn-small" onclick="toggleAdminStudentStatus(' + student.id + ', \'' + nextStatus + '\')">' + label + '</button>' +
    '</div>' +
  '</td>' +
'</tr>';
  }

  document.getElementById('studentsTable').innerHTML = rows;

  var empty = document.getElementById('studentsTableEmpty');
  if (rows === '') {
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
  }
}

// Activate or deactivate a student account.
async function toggleAdminStudentStatus(userId, status) {
  if (!confirm('Change this student account to ' + status + '?')) {
    return;
  }

  var result = await sendRequest('users.php', {
    action: 'toggleStatus',
    user_id: userId,
    status: status
  });

  if (result.ok !== true) {
    alert(result.error);
    return;
  }

  loadAdminStudents();
}

// ---- edit student account modal functions ----

async function openEditStudentModal(userId) {
  var result = await sendRequest('users.php', { action: 'listStudents' });
  var students = result.students || [];
  var targetStudent = null;

  for (var i = 0; i < students.length; i++) {
    if (Number(students[i].id) === Number(userId)) {
      targetStudent = students[i];
      break;
    }
  }

  if (!targetStudent) {
    alert('Student account not found.');
    return;
  }

  // Populate fields with current data
  document.getElementById('editUserId').value = targetStudent.id;
  document.getElementById('editName').value = targetStudent.name;
  document.getElementById('editStudentId').value = targetStudent.studentId;
  document.getElementById('editCourse').value = targetStudent.course;
  document.getElementById('editEmail').value = targetStudent.email;

  hideMessage('editStudentError');
  document.getElementById('editStudentModal').classList.remove('hidden');
}

function closeEditStudentModal() {
  document.getElementById('editStudentModal').classList.add('hidden');
}

async function saveStudentEdits() {
  hideMessage('editStudentError');

  var userId = document.getElementById('editUserId').value;
  var name = document.getElementById('editName').value.trim();
  var studentId = document.getElementById('editStudentId').value.trim();
  var course = document.getElementById('editCourse').value.trim();
  var email = document.getElementById('editEmail').value.trim().toLowerCase();

  if (name === '' || studentId === '' || course === '' || email === '') {
    showMessage('editStudentError', 'Please fill out all required fields.');
    return;
  }

  var result = await sendRequest('users.php', {
    action: 'updateStudent',
    user_id: userId,
    name: name,
    student_id: studentId,
    course: course,
    email: email
  });

  if (result.ok !== true) {
    showMessage('editStudentError', result.error);
    return;
  }

  closeEditStudentModal();
  loadAdminStudents();
  alert('Student account updated successfully.');
}
