let trip = {};
let isFPAvailable = false;
let expense = {};
let initialLoad = false;
let SingleExpenseId;

document.addEventListener(
    'deviceready',
    function () {
        Fingerprint.isAvailable(
            function (result) {
                console.log(result);
                isFPAvailable = true;
            },
            function (error) {
                console.log(error);
                isFPAvailable = false;
            },
            {},
        );

        initiateDatabase();

        navigation();
        $('#btn-delete-all-trips').on('click', function () {
            authentication(
                'Authentication Required',
                'This will delete all trips and expenses',
                function () {
                    deleteAllTripsFromDatabase();
                },
            );
        });

        $('#refresh-list').on('click', function () {
            refreshTripList();
        });

        $('#btn-search-trip').on('click', function () {
            let keywords = validator.escape($.trim($('#search-input').val()));
            searchTrip(keywords);
        });
        let today = new Date();
		let day = today.getDate()
		let dayString = day < 10 ? '0' + day : day;
        let month = today.getMonth() + 1;
        let monthString = month < 10 ? '0' + month : month;
        let dateString =
            monthString + '/' + dayString + '/' + today.getFullYear();

        $('#trip-date').val(dateString);

        $('#expense-date').val(dateString);
    },
    false,
);

// Button and Callbacks
$('#btn-confirm-edit-expense').on('click', function () {
    onExpenseEdit();
});

$('#btn-update-expense').on('click', function () {
    authentication(
        'Authentication Required',
        'Please Authorize to update trip.',
        function () {
            updateExpenseInDatabase(expense);
        },
    );
});

$('#btn-confirm-update-trip').on('click', function () {
    onTripEdit();
});

$('#btn-update-trip').on('click', function () {
    authentication('Authentication Required', 'Please Authorize to update trip.', function () {
        updateTripToDatabase(trip);
    });
});

$('#btn-confirm-trip').on('click', function () {
    onTripAdd();
});

$('#btn-save-trip').on('click', function () {
    addTripToDatabase(trip);
});

$('#btn-confirm-expense').on('click', function () {
    onExpenseAdd();
});

$('#btn-save-expense').on('click', function () {
    addExpenseToDatabase(expense);
});

$('#btn-confirm-delete-trip').on('click', function () {
    onTripDelete();
});

$('#btn-delete-expense').on('click', function () {
    authentication(
        'Authentication Required.',
        'Please authorize to delete expenses.',
        function () {
            deleteExpenseFromDatabase(SingleExpenseId);
        },
    );
});

$('#btn-edit-expense').on('click', function () {
    let tripId = getQueryParam('tripId');
    window.location.href = `updateExpenses.html?tripId=${tripId}&expenseId=${SingleExpenseId}`;
});

$('#btn-delete-single-trip').on('click', function () {
    authentication(
        'Authentication Required.',
        'Please authorize to delete trip and expenses.',
        function () {
            let tripId = getQueryParam('tripId');
            deleteTripFromDatabase(tripId);
        },
    );
});

$('#btn-add-expense').on('click', function () {
    let tripId = getQueryParam('tripId');
    window.location.href = 'addExpenses.html?tripId=' + tripId;
});

$('#btn-edit-trip').on('click', function () {
    let tripId = getQueryParam('tripId');
    window.location.href = 'updateTrip.html?tripId=' + tripId;
});



function navigation() {
    $('#nav-back').on('click', function () {
        window.history.back();
    });

    $('#btn-add-trip').on('click', function () {
        authentication(
            'Authentication Required',
            'Please authorize to add trip.',
            function () {
                window.location.href = 'addTrip.html';
            },
        );
    });
}

function getQueryParam(param) {
    let queryString = window.location.search;
    let urlParams = new URLSearchParams(queryString);
    return urlParams.get(param);
}

function showError(message) {
    navigator.notification.alert(message, null, 'Error', 'OK');
}

function checkConnection() {
    var networkState = navigator.connection.type;

    if (networkState == Connection.NONE) {
        return false;
    }

    return true;
}

function roundToTwo(num) {
    return +(Math.round(num + 'e+2') + 'e-2');
}

function validateNumberString(str) {
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (!regex.test(str)) {
        return false; // Not a valid number string
    }
    const number = parseFloat(str);
    if (number <= 0) {
        return false; // Number is not greater than 0
    }
    return true; // Valid number string and greater than 0
}

// FingerPrint Authenticator 
function authentication(
    title,
    subtitle,
    onSuccess,
) {
    if (isFPAvailable == true) {
        Fingerprint.show(
            {
                title: title,
                subtitle: subtitle,
                description:
                    'Fingerprint authentication is required to proceed.',
            },
            function () {
                console.log('Authentication successful');
                onSuccess();
            },
            function (error) {
                return showError('Authentication failed');
            },
        );
    } else {
        // fingerprint not available, just run success callback
        onSuccess();
    }
}

// Expenses Script 
function onExpenseEdit() {
    let tripId = getQueryParam('tripId');
    let expenseId = getQueryParam('expenseId');
    let expenseType = $.trim($('#edit-expense-type').val());
    let expenseAmount = $.trim($('#edit-expense-amount').val());
    let expenseDate = $.trim($('#edit-expense-date').val());
    let expenseDescription = $.trim($('#edit-expense-description').val());

    if (!tripId) {
        showError('Trip Not Found');
        return;
    }

    if (!expenseId) {
        showError('Expense Not Found');
        return;
    }

    const requiredFields = {
        expenseType: 'Expense Type',
        expenseAmount: 'Expense Amount',
        expenseDate: 'Date of Expense',
    };

    const emptyFields = [];

    for (const [fieldName, errorMsg] of Object.entries(requiredFields)) {
        const fieldValue = eval(fieldName);
        if (
            !fieldValue ||
            (fieldName === 'expenseType' &&
                fieldValue === 'Select expense type')
        ) {
            emptyFields.push(errorMsg);
        }
    }

    if (emptyFields.length > 0) {
        return showError(emptyFields.join(', ') + 'is required');
    }

    if (validateNumberString(expenseAmount)) {
        let num = parseFloat(expenseAmount);
        expenseAmount = roundToTwo(num);
    } else {
        return showError('Expense Amount must be a number');
    }

    expense = {
        tripId,
        expenseId,
        expenseType: validator.escape(expenseType),
        expenseAmount,
        expenseDate,
        expenseDescription: validator.escape(expenseDescription),
    };

    const newP = $('<p></p>').addClass(
        'text-base leading-relaxed text-gray-500 dark:text-gray-300',
    ).html(`<strong>Type:</strong> ${expense.expenseType}<br>
           <strong>Amount:</strong> ${expense.expenseAmount}<br>
           <strong>Date:</strong> ${expense.expenseDate}<br>
           <strong>Description:</strong> ${expense.expenseDescription}`);

    $('#confirmation-modal').empty().append(newP);

    const modal = document.getElementById('btn-open-modal');
    modal.click();
}

function updateExpenseInDatabase(expense) {
    const {
        tripId,
        expenseId,
        expenseType,
        expenseAmount,
        expenseDate,
        expenseDescription,
    } = expense;

    UseQuery(
        SQL_UPDATE_EXPENSE,
        [
            expenseType,
            expenseAmount,
            expenseDate,
            expenseDescription,
            expenseId,
        ],
        function (result) {
            console.log('Expense Added');
            if (checkConnection()) {
                syncSingleTrip(tripId, true);
            } else {
                window.history.back();
            }
        },
    );
}

function returnIndividualExpense(expenseId) {
    UseQuery(SQL_SELECT_INDIVIDUAL_EXPENSE, [expenseId], function (result) {
        for (let i = 0; i < result.rows.length; i++) {
            // (`trip_id`, `type`, `amount`, `date`, `description`)
            let tripId = result.rows.item(i).trip_id;
            let expenseType = result.rows.item(i).type;
            let expenseAmount = result.rows.item(i).amount;
            let expenseDate = result.rows.item(i).date;
            let expenseDescription = result.rows.item(i).description;

            $('#edit-expense-type').val(expenseType);
            $('#edit-expense-amount').val(expenseAmount);
            $('#edit-expense-date').val(expenseDate);
            $('#edit-expense-date').val(expenseDate);
            $('#edit-expense-description').val(expenseDescription);
        }
    });
}


// Edit Trip Script
function onTripEdit() {
    let tripId = getQueryParam('tripId');
    let tripName = $.trim($('#edit-trip-name').val());
    let tripStatus = $.trim($('#edit-trip-status').val());
    let tripDestination = $.trim($('#edit-trip-destination').val());
    let tripType = $.trim($('#edit-trip-type').val());
    let tripDate = $.trim($('#edit-trip-date').val());
    let tripBudget = $.trim($('#edit-trip-budget').val());
    let tripRisk = $('#edit-trip-risk').is(':checked') ? 1 : 0;
    let tripDescription = $.trim($('#edit-trip-description').val());

    if (!tripId) {
        return showError('Trip Not Found');
    }

    const requiredFields = {
        tripName: 'Trip Name',
        tripStatus: 'Trip Status',
        tripDestination: 'Trip Destination',
        tripType: 'Trip Type',
        tripDate: 'Trip Date',
        tripBudget: 'Trip Budget',
    };

    const emptyFields = [];

    for (const [fieldName, errorMsg] of Object.entries(requiredFields)) {
        const fieldValue = eval(fieldName);
        if (
            !fieldValue ||
            (fieldName === 'tripType' && fieldValue === 'Select trip type')
        ) {
            emptyFields.push(errorMsg);
        }
        if (
            !fieldValue ||
            (fieldName === 'tripStatus' && fieldValue === 'Choose Trip Status:')
        ) {
            emptyFields.push(errorMsg);
        }
    }

    if (emptyFields.length > 0) {
        return showError(emptyFields.join(', ') + ' is required');
    }

    if (validateNumberString(tripBudget)) {
        let num = parseFloat(tripBudget);
        tripBudget = roundToTwo(num);
    } else {
        return showError('Trip Budget must be a number');
    }

    trip = {
        tripId,
        tripName: validator.escape(tripName),
        tripStatus: validator.escape(tripStatus),
        tripDestination: validator.escape(tripDestination),
        tripType: validator.escape(tripType),
        tripDate,
        tripBudget,
        tripRisk,
        tripDescription: validator.escape(tripDescription),
    };

    const newP = $('<p></p>').addClass(
        'text-base leading-relaxed text-gray-500 dark:text-gray-300',
    ).html(`<strong>Trip Name:</strong> ${trip.tripName}<br>
            <strong>Trip Status:</strong> ${trip.tripStatus}<br>
           <strong>Destination:</strong> ${trip.tripDestination}<br>
           <strong>Type:</strong> ${trip.tripType}<br>
           <strong>Date:</strong> ${trip.tripDate}<br>
           <strong>Budget:</strong> ${trip.tripBudget}<br>
           <strong>Risk:</strong> ${trip.tripRisk === 1 ? 'Yes' : 'No'}<br>
           <strong>Description:</strong> ${trip.tripDescription}`);

    $('#confirmation-modal').empty().append(newP);

    const modal = document.getElementById('btn-open-modal');
    modal.click();
}

function updateTripToDatabase(trip) {
    const {
        tripId,
        tripName,
        tripStatus,
        tripDestination,
        tripType,
        tripDate,
        tripBudget,
        tripRisk,
        tripDescription,
    } = trip;

    UseQuery(
        SQL_UPDATE_TRIP,
        [
            tripName,
            tripStatus,
            tripDestination,
            tripType,
            tripDate,
            tripBudget,
            tripRisk,
            tripDescription,
            tripId,
        ],
        function (result) {
            if (checkConnection()) {
                syncSingleTrip(tripId, true);
            } else {
                console.log('Trip Updated');
                window.history.back();
            }
        },
    );
}

function returnIndividualTrip(tripId) {
    UseQuery(SQL_SELECT_TRIP, [tripId], function (result) {
        for (let i = 0; i < result.rows.length; i++) {
            let tripId = result.rows.item(i).trip_id;
            let tripName = result.rows.item(i).name;
            let tripStatus = result.rows.item(i).status;
            let tripDestination = result.rows.item(i).destination;
            let tripType = result.rows.item(i).type;
            let tripDate = result.rows.item(i).date;
            let tripBudget = result.rows.item(i).budget;
            let tripRisk = result.rows.item(i).risk;
            let tripDescription = result.rows.item(i).description;

            $('#edit-trip-name').val(tripName);
            $('#edit-trip-status').val(tripStatus);
            $('#edit-trip-destination').val(tripDestination);
            $('#edit-trip-type').val(tripType);
            $('#edit-trip-date').val(tripDate);
            $('#edit-trip-budget').val(tripBudget);
            $('#edit-trip-risk').prop('checked', tripRisk == 1);
            $('#edit-trip-description').val(tripDescription);
        }
    });
}

// Add Trip Script
function onTripAdd() {
    let tripName = $.trim($('#trip-name').val());
    let tripStatus = $.trim($('#trip-status').val());
    let tripDestination = $.trim($('#trip-destination').val());
    let tripType = $.trim($('#trip-type').val());
    let tripDate = $.trim($('#trip-date').val());
    let tripBudget = $.trim($('#trip-budget').val());
    let tripRisk = $('#trip-risk').is(':checked') ? 1 : 0;
    let tripDescription = $.trim($('#trip-description').val());

    const requiredFields = {
        tripName: 'Trip Name',
        tripStatus: 'Trip Status',
        tripDestination: 'Trip Destination',
        tripType: 'Trip Type',
        tripDate: 'Trip Date',
        tripBudget: 'Trip Budget',
    };

    const emptyFields = [];

    for (const [fieldName, errorMsg] of Object.entries(requiredFields)) {
        const fieldValue = eval(fieldName);
        if (
            !fieldValue ||
            (fieldName === 'tripType' && fieldValue === 'Select trip type')
        ) {
            emptyFields.push(errorMsg);
        }
        if (
            !fieldValue ||
            (fieldName === 'tripStatus' && fieldValue === 'Choose Trip Status:')
        ) {
            emptyFields.push(errorMsg);
        }
    }

    if (emptyFields.length > 0) {
        showError(emptyFields.join(', ') + ' is required');
        return;
    }

    if (validateNumberString(tripBudget)) {
        let num = parseFloat(tripBudget);
        tripBudget = roundToTwo(num);
    } else {
        return showError('Trip Budget must be a number');
    }

    trip = {
        tripName: validator.escape(tripName),
        tripStatus: validator.escape(tripStatus),
        tripDestination: validator.escape(tripDestination),
        tripType: validator.escape(tripType),
        tripDate,
        tripBudget,
        tripRisk,
        tripDescription: validator.escape(tripDescription),
    };

    const newP = $('<p></p>').addClass(
        'text-base leading-relaxed text-gray-500 dark:text-gray-300',
    ).html(`<strong>Trip Name:</strong> ${trip.tripName}<br>
            <strong>Status:</strong> ${trip.tripStatus}<br>
           <strong>Destination:</strong> ${trip.tripDestination}<br>
           <strong>Type:</strong> ${trip.tripType}<br>
           <strong>Date:</strong> ${trip.tripDate}<br>
           <strong>Budget:</strong> ${trip.tripBudget}<br>
           <strong>Risk:</strong> ${trip.tripRisk === 1 ? 'Yes' : 'No'}<br>
           <strong>Description:</strong> ${trip.tripDescription}`);

    $('#confirmation-modal').empty().append(newP);

    const modal = document.getElementById('btn-open-modal');
    modal.click();
}

function addTripToDatabase(trip) {
    const {
        tripName,
        tripStatus,
        tripDestination,
        tripType,
        tripDate,
        tripBudget,
        tripRisk,
        tripDescription,
    } = trip;

    UseQuery(
        SQL_INSERT_TRIP,
        [
            tripName,
            tripStatus,
            tripDestination,
            tripType,
            tripDate,
            tripBudget,
            tripRisk,
            tripDescription,
        ],
        function (result) {
            const { insertId } = result;
            if (checkConnection()) {
                syncSingleTrip(insertId, true);
            } else {
                console.log('Trip Added');
                window.history.back();
            }
        },
    );
}

// Add Expenses Script 
function onExpenseAdd() {
    let tripId = getQueryParam('tripId');
    let expenseType = $.trim($('#expense-type').val());
    let expenseAmount = $.trim($('#expense-amount').val());
    let expenseDate = $.trim($('#expense-date').val());
    let expenseDescription = $.trim($('#expense-description').val());

    if (!tripId) {
        return showError('Trip Not Found');
    }


    
    const requiredFields = {
        expenseType: 'Expense Type',
        expenseAmount: 'Expense Amount',
        expenseDate: 'Date of Expense',
    };

    const emptyFields = [];

    for (const [fieldName, errorMsg] of Object.entries(requiredFields)) {
        const fieldValue = eval(fieldName);
        if (
            !fieldValue ||
            (fieldName === 'expenseType' &&
                fieldValue === 'Select expense type')
        ) {
            emptyFields.push(errorMsg);
        }
    }

    if (emptyFields.length > 0) {
        return showError(emptyFields.join(', ') + 'is required');
    }

    if (validateNumberString(expenseAmount)) {
        let num = parseFloat(expenseAmount);
        expenseAmount = roundToTwo(num);
    } else {
        return showError('Expense Amount must be a number');
    }

    expense = {
        tripId: validator.escape(tripId),
        expenseType: validator.escape(expenseType),
        expenseAmount,
        expenseDate,
        expenseDescription: validator.escape(expenseDescription),
    };

    const newP = $('<p></p>').addClass(
        'text-base leading-relaxed text-gray-500 dark:text-gray-300',
    ).html(`<strong>Type:</strong> ${expense.expenseType}<br>
           <strong>Amount:</strong> ${expense.expenseAmount}<br>
           <strong>Date:</strong> ${expense.expenseDate}<br>
           <strong>Description:</strong> ${expense.expenseDescription}`);

    $('#confirmation-modal').empty().append(newP);

    const modal = document.getElementById('btn-open-modal');
    modal.click();
}

function addExpenseToDatabase(expense) {
    const {
        tripId,
        expenseType,
        expenseAmount,
        expenseDate,
        expenseDescription,
    } = expense;

    UseQuery(
        SQL_INSERT_EXPENSE,
        [tripId, expenseType, expenseAmount, expenseDate, expenseDescription],
        function (result) {
            console.log('Expense Added');

            if (checkConnection()) {
                syncSingleTrip(tripId, true);
            } else {
                window.history.back();
            }
        },
    );
}


// Delete Trip Script
function onExpenseDelete(expenseId) {
    if (!expenseId) {
        return showError('Expense Not Found');
    }

    SingleExpenseId = expenseId;

    const modal = document.getElementById('btn-delete-expense-modal');

    modal.click();
}

function onTripDelete() {
    let tripId = getQueryParam('tripId');

    if (!tripId) {
        return showError('Trip Not Found');
    }

    const modal = document.getElementById('btn-delete-trip-modal');

    modal.click();
}

function deleteExpenseFromDatabase(expenseId) {
    let tripId = getQueryParam('tripId');
    UseQuery(SQL_DELETE_EXPENSE, [expenseId], function (result) {
        if (checkConnection()) {
            syncSingleTrip(tripId, false, true);
        } else {
            console.log('Expense deleted');
            window.location.reload();
        }
    });
}

function deleteTripFromDatabase(tripId) {
    UseQuery(SQL_DELETE_TRIP_EXPENSE, [tripId], function (result) {
        if (checkConnection()) {
            syncSingleTrip(tripId, true);
        } else {
            console.log('Trip Deleted');
            window.history.back();
        }
    });

    UseQuery(SQL_DELETE_TRIP, [tripId], function (result) {
        // success callback
        console.log('Trip Deleted');
        window.history.back();
    });
}


