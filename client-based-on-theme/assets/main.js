'use strict';

var _bookings;

function handleSubmit() {
	// Get the selected booking
	var selectedBooking = _bookings.filter(function (e) {
		return e.selected === true;
	})[0];

	if (!selectedBooking) {
		console.log('Nothing is selected!!!');
		return;
	}

	// Get the properties we need to add
	var name = document.getElementById('name').value;
	var email = document.getElementById('email').value;
	var partySize = document.getElementById('partySize').value;

	// Construct our booking object
	var newBooking = {
		date: selectedBooking.date,
		time: selectedBooking.time,
		name: name,
		email: email,
		partySize: partySize
	};

	var body = JSON.stringify(newBooking);

	// Post booking to server
	fetch('/booking', {
		headers: new Headers({
			'content-type': 'application/json'
		}),
		method: 'POST',
		body: body
	}).then(function () {
		alert('Successfully booked!');
		window.location.reload(false);
	}).catch(console.error);
}

function handleBookingsClick(booking, elem) {
	// Remove selection from other elements
	var selected = document.querySelectorAll('.selected');
	selected.forEach(function (e) {
		e.classList.remove('selected');
	});

	// Select the element
	elem.classList.add('selected');

	// Update model
	_bookings = _bookings.map(function (e) {
		e.selected = false;
		return e;
	});
	booking.selected = true;
}

function addBookingsToPage(bookings) {
	_bookings = bookings;

	var parent = document.getElementById('bookings');

	_bookings.forEach(function (e) {
		var bookingElem = document.createElement('div');

		bookingElem.innerHTML = '<span><strong>Date:</strong> ' + e.date + '</span><span><strong>Time:</strong> ' + e.time + '</span>';
		bookingElem.classList.add('booking');
		bookingElem.onclick = function () {
			handleBookingsClick(e, bookingElem);
		};

		parent.appendChild(bookingElem);
	});
}

window.onload = function () {
	fetch('/bookings').then(function (data) {
		return data.json();
	}).then(addBookingsToPage);

	var btn = document.getElementById('submit');
	btn.onclick = handleSubmit;
};