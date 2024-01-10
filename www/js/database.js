let db = null;
let isDbReady = false;
let currentTripId;
//SQL Statement for Trip Table
const SQL_CREATE_TRIP_TABLE = 'CREATE TABLE IF NOT EXISTS `trip` ( `trip_id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT, `status` TEXT, `destination` TEXT, `type` TEXT, `date` TEXT, `budget` REAL, `risk` INTEGER, `description` TEXT );';
const SQL_INSERT_TRIP = 'INSERT INTO `trip` (`name`, `status`, `destination`, `type`, `date`, `budget`, `risk`, `description`) VALUES (?, ?, ?, ?, ?, ?, ?, ?);';
const SQL_SELECT_ALL_TRIP = 'SELECT * FROM `trip`;';
const SQL_SELECT_TRIP = 'SELECT * FROM `trip` WHERE `trip_id` = ?;';
const SQL_DELETE_TRIP = 'DELETE FROM `trip` WHERE `trip_id` = ?;';
const SQL_DELETE_TRIP_EXPENSE = 'DELETE FROM `expense` WHERE `trip_id` = ?;';
const SQL_UPDATE_TRIP = 'UPDATE `trip` SET `name` = ?, `status` = ?, `destination` = ?, `type` = ?, `date` = ?, `budget` = ?, `risk` = ?, `description` = ? WHERE `trip_id` = ?;';
// SQL Statement for Expense Table
const SQL_CREATE_EXPENSE_TABLE = 'CREATE TABLE IF NOT EXISTS `expense` ( `expense_id` INTEGER PRIMARY KEY AUTOINCREMENT, `trip_id` INTEGER, `type` TEXT, `amount` REAL, `date` TEXT, `description` TEXT );';
const SQL_INSERT_EXPENSE = 'INSERT INTO `expense` (`trip_id`, `type`, `amount`, `date`, `description`) VALUES (?, ?, ?, ?, ?);';
const SQL_SELECT_ALL_EXPENSE = 'SELECT * FROM `expense`;';
const SQL_SELECT_EXPENSE = 'SELECT * FROM `expense` WHERE `trip_id` = ?;';
const SQL_SELECT_INDIVIDUAL_EXPENSE = 'SELECT * FROM `expense` WHERE `expense_id` = ?;';
const SQL_DELETE_EXPENSE = 'DELETE FROM `expense` WHERE `expense_id` = ?;';
const SQL_UPDATE_EXPENSE = 'UPDATE `expense` SET `type` = ?, `amount` = ?, `date` = ?, `description` = ? WHERE `expense_id` = ?;';
// Miscellanous SQL Statement
const SQL_SEARCH_TRIP = 'SELECT * FROM `trip` WHERE `name` LIKE ? OR `destination` LIKE ? OR `status` LIKE ?;';
const SQL_DELETE_ALL_TRIP = 'DELETE FROM `trip`;';
const SQL_DELETE_ALL_EXPENSE = 'DELETE FROM `expense`;';

function initiateDatabase() {
    db = window.sqlitePlugin.openDatabase(
        {
            name: 'database.db',
            location: 'default',
        },
        function (database) {
            // success callback
            const db = database;
            db.transaction(
                function (tx) {
                    tx.executeSql(
                        SQL_CREATE_TRIP_TABLE,
                        [],
                        function (tx, result) {
                            // success callback
                            isDbReady = true;
                            console.log('Trip Table created');
                            refreshTripList();
                        },
                        function (tx, error) {
                            // error callback
                            isDbReady = false;
                            console.log(
                                'Trip Table creation failed',
                                error.message,
                            );
                        },
                    );
                },
                function (error) {
                    isDbReady = false;
                }, // error callback
                function () {}, // success callback
            );

            db.transaction(
                function (tx) {
                    tx.executeSql(
                        SQL_CREATE_EXPENSE_TABLE,
                        [],
                        function (tx, result) {
                            // success callback
                            isDbReady = true;
                            console.log('Expense Table created');
                        },
                        function (tx, error) {
                            // error callback
                            isDbReady = false;
                            console.log(
                                'Trip Expense creation failed',
                                error.message,
                            );
                        },
                    );
                },
                function (error) {
                    isDbReady = false;
                }, // error callback
                function () {}, // success callback
            );
        },
        function (error) {},
    );
}

function refreshTripList() {
    UseQuery(SQL_SELECT_ALL_TRIP, [], function (result) {
        $('#trips-list').empty();
        for (let i = 0; i < result.rows.length; i++) {
            let tripId = result.rows.item(i).trip_id;
            let tripName = result.rows.item(i).name;
            let tripDestination = result.rows.item(i).destination;
            let tripDate = result.rows.item(i).date;

            // Create trip element
            let tripElement = $('<div>', {
                class: 'm-4 w-full rounded-lg border border-gray-200 bg-white p-4 shadow',
            })
                .attr('trip_id', tripId)
                .on('click', function () {
                    let trip_id = $(this).attr('trip_id');
                    authentication(
                        'Authentication Required',
                        'Please authorize to open trip particular.',
                        function () {
                            openTrip(trip_id);
                        },
                    );
                });

            tripElement.append(
                $('<h5>', {
                    class: 'mb-2 text-2xl font-bold tracking-tight text-gray-900',
                    text: tripName,
                }),
            );
            tripElement.append(
                $('<p>', {
                    class: 'font-normal text-gray-700',
                    text: tripDestination,
                }),
            );
            tripElement.append(
                $('<p>', {
                    class: 'font-normal text-gray-700',
                    text: tripDate,
                }),
            );

            // Add trip element to list
            $('#trips-list').append(tripElement);
        }
    });
}

function refreshIndividualTrip(tripId) {
    UseQuery(SQL_SELECT_TRIP, [tripId], function (result) {
        $('#trip-particular').empty();
        totalBudget = 0;
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

            let tripHTML = `
            
                <article class="format lg:format-lg">
                    <h5
                        class="mb-2 text-2xl font-bold tracking-tight text-gray-900"
                    >
                        ${tripName}
                    </h5>
                    <p class="font-normal text-gray-700">
                        <strong>Status: </strong>${tripStatus}
                    </p>
                    <p class="font-normal text-gray-700">
                        <strong>Destination: </strong>${tripDestination}
                    </p>
                    <p class="font-normal text-gray-700">
                        <strong>Type: </strong>${tripType}
                    </p>
                    <p class="font-normal text-gray-700">
                        <strong>Date: </strong>${tripDate}
                    </p>
                    <p class="font-normal text-gray-700">
                        <strong>Budget: </strong>Rm${tripBudget}
                    </p>
                    <p class="font-normal text-gray-700">
                        <strong>Risk Assessment: </strong>${
                            tripRisk === 1 ? 'Yes' : 'No'
                        }
                    </p>
                    <p class="font-normal text-gray-700">
                        <strong>Description: </strong>${tripDescription}
                    </p>
                </article>`;
            totalBudget += parseFloat(tripBudget);
            $('#trip-particular').append(tripHTML);
        }
    });
}

function refreshTripExpense(tripId) {
    UseQuery(SQL_SELECT_EXPENSE, [tripId], function (result) {
        $('#expenses-list').empty();
        let totalExpenses = 0;

        for (let i = 0; i < result.rows.length; i++) {
            // `trip_id`, `type`, `amount`, `date`, `description
            let expenseId = result.rows.item(i).expense_id;
            let tripId = result.rows.item(i).trip_id;
            let expenseType = result.rows.item(i).type;
            let expenseAmount = result.rows.item(i).amount;
            let expenseDate = result.rows.item(i).date;
            let expenseDescription = result.rows.item(i).description;

            let expenseHTML = $(`
            <div expense_id="${expenseId}" class="m-4 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow">
                <div>
                    <h5
                        class="mb-2 text-2xl font-bold tracking-tight text-gray-900"
                    >
                        ${expenseType}
                    </h5>
                    <p class="font-normal text-gray-700">
                        ${expenseDescription}
                    </p>
                    <span class="text-sm text-gray-500"
                        >${expenseDate}</span
                    >
                </div>
                <div class="text-right">
                    <p
                        class="mb-2 text-md font-bold tracking-tight text-gray-900"
                    >
                        Rm${expenseAmount}
                    </p>
                </div>
            </div>`).on('click', function () {
                let expense_id = $(this).attr('expense_id');
                onExpenseDelete(expense_id);
            });

            $('#expenses-list').append(expenseHTML);

            totalExpenses += parseFloat(expenseAmount);
            console.log(totalExpenses);
        }
    });
}

function openTrip(tripId) {
    window.location.href = 'tripParticular.html?tripId=' + tripId;
}

function deleteAllTripsFromDatabase() {
    UseQuery(SQL_DELETE_ALL_TRIP, [], function (result) {
        console.log('Success');
    });

    UseQuery(SQL_DELETE_ALL_EXPENSE, [], function (result) {
        console.log('Success');
        window.location.reload();
    });
}

function syncAllToCloud() {
    if (!isDbReady) {
        showError('Database is not ready. Please try again later.');
        return;
    }

    db.transaction((tx) => {
        tx.executeSql(SQL_SELECT_ALL_TRIP, [], (tx, results) => {
            const trips = [];

            for (let i = 0; i < results.rows.length; i++) {
                const tripRow = results.rows.item(i);
                const trip = {
                    tid: tripRow.trip_id,
                    name: tripRow.name,
                    expenses: [],
                    others: [
                        { trip_status: tripRow.status },
                        { trip_type: tripRow.type },
                        { trip_date: tripRow.date },
                        { trip_budget: tripRow.budget },
                        { risk: tripRow.risk },
                        { trip_description: tripRow.description },
                    ],
                };

                tx.executeSql(
                    SQL_SELECT_EXPENSE,
                    [tripRow.trip_id],
                    (tx, expenseResults) => {
                        for (let j = 0; j < expenseResults.rows.length; j++) {
                            const expenseRow = expenseResults.rows.item(j);
                            const expense = {
                                type: expenseRow.type,
                                amount: expenseRow.amount,
                                others: [
                                    { expense_date: expenseRow.date },
                                    {
                                        expense_description:
                                            expenseRow.description,
                                    },
                                ],
                            };

                            trip.expenses.push(expense);

                        
                        }
                    },
                );
            }
        }),
            (tx, error) => {
                showError('Data Retrieval Failed: ' + error.message);
            };
    });
}

function syncSingleTrip(tripId, back, reload) {
    if (!isDbReady) {
        showError('Database is not ready. Please try again later.');
        return;
    }

    db.transaction((tx) => {
        tx.executeSql(SQL_SELECT_TRIP, [tripId], (tx, results) => {
            const trips = [];

            for (let i = 0; i < results.rows.length; i++) {
                const tripRow = results.rows.item(i);
                const trip = {
                    tid: tripRow.trip_id,
                    name: tripRow.name,
                    expenses: [],
                    others: [
                        {trip_status: tripRow.status },
                        { trip_type: tripRow.type },
                        { trip_date: tripRow.date },
                        { trip_budget: tripRow.budget },
                        { risk: tripRow.risk },
                        { trip_description: tripRow.description },
                    ],
                };

                tx.executeSql(
                    SQL_SELECT_EXPENSE,
                    [tripRow.trip_id],
                    (tx, expenseResults) => {
                        for (let j = 0; j < expenseResults.rows.length; j++) {
                            const expenseRow = expenseResults.rows.item(j);
                            const expense = {
                                type: expenseRow.type,
                                amount: expenseRow.amount,
                                others: [
                                    { expense_date: expenseRow.date },
                                    {
                                        expense_description:
                                            expenseRow.description,
                                    },
                                ],
                            };

                            trip.expenses.push(expense);
                        }

                        trips.push(trip);

                        
                    },
                );
            }
        }),
            (tx, error) => {
                showError('Data Retrieval Failed: ' + error.message);
            };
    });
}

function searchTrip(keywords) {
    let searchKeyword = `%${keywords}%`;

    UseQuery(
        SQL_SEARCH_TRIP,
        [searchKeyword, searchKeyword],
        function (result) {
            $('#trips-list').empty();
            for (let i = 0; i < result.rows.length; i++) {
                let tripId = result.rows.item(i).trip_id;
                let tripName = result.rows.item(i).name;
                let tripDestination = result.rows.item(i).destination;

                // Create trip element
                let tripElement = $('<div>', {
                    class: 'm-4 w-full rounded-lg border border-gray-200 bg-white p-4 shadow',
                })
                    .attr('trip_id', tripId)
                    .on('click', function () {
                        let trip_id = $(this).attr('trip_id');
                        openTrip(trip_id);
                    });

                tripElement.append(
                    $('<h5>', {
                        class: 'mb-2 text-2xl font-bold tracking-tight text-gray-900',
                        text: tripName,
                    }),
                );
                tripElement.append(
                    $('<p>', {
                        class: 'font-normal text-gray-700',
                        text: tripDestination,
                    }),
                );

                // Add trip element to list
                $('#trips-list').append(tripElement);
            }
        },
    );
}
function UseQuery(QUERY, fields, successCallback) {
    if (!isDbReady) {
        showError('Database is not ready. Please try again later.');
        return;
    }

    db.transaction(function (tx) {
        tx.executeSql(
            QUERY,
            [...fields],
            function (tx, result) {
                successCallback(result);
            },
            function (tx, error) {
                showError(error.message);
            },
        );
    });
}
