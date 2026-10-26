<?php
// Receives enquiries from the contact form (contact.html) and saves them to data/enquiries.csv.
// TODO: also send an email / SMS here once the hosting has mail configured.

header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Asia/Kolkata');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function text_length(string $s): int
{
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s);
}

// Stops spreadsheet apps from treating a value as a formula when the CSV is opened.
function csv_safe(string $s): string
{
    return preg_match('/^[=+\-@]/', $s) ? "'" . $s : $s;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'Method not allowed.']);
}

$isJson = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false;
$body = $isJson ? json_decode(file_get_contents('php://input'), true) : $_POST;
if (!is_array($body)) {
    respond(400, ['ok' => false, 'error' => 'Invalid request.']);
}

$fields = ['name', 'phone', 'location', 'propertyType', 'cameras', 'message'];
$input = [];
foreach ($fields as $field) {
    $input[$field] = isset($body[$field]) && is_string($body[$field]) ? trim($body[$field]) : '';
}

// Same rules as the form in assets/js/main.js.
$propertyTypes = ['Home / Flat', 'Shop / Showroom', 'Office', 'Society / RWA', 'School / Hospital', 'Factory / Warehouse'];
$phone = preg_replace('/^(\+91|91|0)(?=\d{10}$)/', '', preg_replace('/[\s-]/', '', $input['phone']));
$errors = [];

if (text_length($input['name']) < 2) $errors['name'] = 'Please enter your name.';
if (!preg_match('/^[6-9]\d{9}$/', $phone)) $errors['phone'] = 'Enter a valid 10-digit mobile number.';
if ($input['location'] === '') $errors['location'] = 'Please tell us your area or city.';
if ($input['propertyType'] !== '' && !in_array($input['propertyType'], $propertyTypes, true)) {
    $errors['propertyType'] = 'Please choose a property type.';
}
if (text_length($input['message']) > 1000) $errors['message'] = 'Message is too long.';

if ($errors) {
    respond(422, ['ok' => false, 'errors' => $errors]);
}

$dir = __DIR__ . '/data';
if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
    respond(500, ['ok' => false, 'error' => 'Could not save enquiry.']);
}
// Keep the enquiries file private on Apache.
if (!file_exists($dir . '/.htaccess')) {
    file_put_contents($dir . '/.htaccess', "Require all denied\n");
}

$file = $dir . '/enquiries.csv';
$isNew = !file_exists($file);
$handle = fopen($file, 'a');
if ($handle === false) {
    respond(500, ['ok' => false, 'error' => 'Could not save enquiry.']);
}
flock($handle, LOCK_EX);
if ($isNew) {
    fputcsv($handle, ['Received at', 'Name', 'Phone', 'Location', 'Property type', 'Cameras', 'Message']);
}
fputcsv($handle, [
    date('Y-m-d H:i:s'),
    csv_safe($input['name']),
    $phone,
    csv_safe($input['location']),
    $input['propertyType'],
    $input['cameras'],
    csv_safe($input['message']),
]);
flock($handle, LOCK_UN);
fclose($handle);

respond(200, ['ok' => true]);
