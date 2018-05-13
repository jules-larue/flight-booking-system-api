/**
* @fileOverview Flight reservation administration dashboard. It utilizes the Flight Booking
API to handle user information (retrieve user list, edit user profile,
as well as add and remove new users form the system). It also
permits to list the user reservations
template flight.
* @author <a href="mailto:jules.larue@student.oulu.fi">Jules Larue</a>
* @version 1.0
**/


/**** START CONSTANTS****/

/**
* Set this to true to activate the debugging messages.
* @constant {boolean}
* @default
*/
var DEBUG = true;

/**
* Mason+JSON mime-type
* @constant {string}
* @default
*/
const MASONJSON = "application/vnd.mason+json";

const PLAINJSON = "application/json";

/**
* Link to Users_profile
* @constant {string}
* @default
*/
const FLIGHT_BOOKING_SYSTEM_USER_PROFILE = "/profiles/users";

/**
* Link to Flights profile
* @constant {string}
* @default
*/
const FLIGHT_BOOKING_SYSTEM_FLIGHT_PROFILE = "/profiles/flights";

/**
* Link to Template Flights profile
* @constant {string}
* @default
*/
const FLIGHT_BOOKING_SYSTEM_TEMPLATE_FLIGHT_PROFILE = "/profiles/template-flights";

/**
* Link to Reservations profile
* @constant {string}
* @default
*/
const FLIGHT_BOOKING_SYSTEM_RESERVATION_PROFILE = "/profiles/reservations";

/**
* Default datatype to be used when processing data coming from the server.
* Due to JQuery limitations we should use json in order to process Mason responses
* @constant {string}
* @default
*/
const DEFAULT_DATATYPE = "json";

/**
* Entry point of the application
* @constant {string}
* @default
*/
const ENTRYPOINT = "/flight-booking-system/api/users"; //Entrypoint: Resource Users


/**
* Associated rel attribute: Users Mason+JSON and users-all
*
* Sends an AJAX GET request to retrieve the list of all the users of the application
*
* ONSUCCESS=> Show users in the #user_list.
*             After processing the response it utilizes the method {@link #appendUserToList}
*             to append the user to the list.
*             Each user is an anchor pointing to the respective user url.
When clicking a user, the user data is shown to the right.

* ONERROR => Show an alert to the user.
*
* @author Ivan Sanchez
* @param {string} [apiurl = ENTRYPOINT] - The url of the Users instance.
**/
function getUsers(apiurl) {
  apiurl = apiurl || ENTRYPOINT;
  $("#mainContent").hide();
  return $.ajax({
    url: apiurl,
    type: 'get',
    dataType:DEFAULT_DATATYPE
  }).always(function(){
    //Remove old list of users
    //clear the form data hide the content information(no selected)
    $("#user_list").empty();
    $("#mainContent").hide();

    }).done(function (data, textStatus, jqXHR){
    if (DEBUG) {
      console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
    }
    //Extract the users
    users = data.items;
    for (var i=0; i < users.length; i++){
      var user = users[i];

      // Append the user to the list that will display his name.
      appendUserToList(user["@controls"].self.href, getFullName(user));
    }

    //Prepare the new_user_form to create a new user
    var create_ctrl = data["@controls"]["flight-booking-system:add-user"]

    if (create_ctrl.schema) {
      createFormFromSchema(create_ctrl.href, create_ctrl.schema, "new_user_form");
    }
    else if (create_ctrl.schemaUrl) {
      $.ajax({
        url: create_ctrl.schemaUrl,
        dataType: DEFAULT_DATATYPE
      }).done(function (data, textStatus, jqXHR) {
        createFormFromSchema(create_ctrl.href, data, "new_user_form");
      }).fail(function (jqXHR, textStatus, errorThrown) {
        if (DEBUG) {
          console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
        }
        alert_error("Could not fetch form schema. Please, try again");
      });
    }
  }).fail(function (jqXHR, textStatus, errorThrown){
    if (DEBUG) {
      console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
    }
    //Inform user about the error using an alert message.
    alert_error("Could not fetch the list of users.  Please, try again");
  });
}


/**
* Populate a form with the <input> elements contained in the <i>schema</i> input parameter.
* The action attribute is filled in with the <i>url</i> parameter. Values are filled
* with the default values contained in the template. It also marks inputs with required property.
*
* @author Ivan Sanchez
* @param {string} url - The url of to be added in the action attribute
* @param {Object} schema - a JSON schema object ({@link http://json-schema.org/})
* which is utlized to append <input> elements in the form
* @param {string} id - The id of the form is gonna be populated
**/
function createFormFromSchema(url,schema,id){
  $form=$('#'+ id);
  $form.attr("action",url);
  //Clean the forms
  $form_content=$(".form_content",$form);
  $form_content.empty();
  $("input[type='button']",$form).hide();
  if (schema.properties) {
    var props = schema.properties;
    Object.keys(props).forEach(function(key, index) {
      if (props[key].type == "object") {
        appendObjectFormFields($form_content, key, props[key]);
      }
      else {
        appendInputFormField($form_content, key, props[key], schema.required.includes(key));
      }

    });
  }

  return $form;
}



function createFormFromSchemaForTicket(url,schema,id){
  $form=$('#'+ id);
  $form.attr("action",url);
  //Clean the forms
  $form.append('<div class="form_content"></div>')
  $form_content=$("#" + id + " .form_content");
  $form_content.empty();
  $("input[type='button']",$form).hide();
  if (schema.properties) {
    var props = schema.properties;
    Object.keys(props).forEach(function(key, index) {
      if (props[key].type == "object") {
        appendObjectFormFields($form_content, key, props[key]);
      }
      else {
        appendInputFormField($form_content, key, props[key], schema.required.includes(key));
      }

    });
  }

  return $form;
}




/**
* Private class used by {@link #createFormFromSchema}
*
* @author Ivan Sanchez
* @param {jQuery} container - The form container
* @param {string} The name of the input field
* @param {Object} object_schema - a JSON schema object ({@link http://json-schema.org/})
* which is utlized to append properties of the input
* @param {boolean} required- If it is a mandatory field or not.
**/
function appendInputFormField($container, name, object_schema, required) {
  var input_id = name;
  var prompt = object_schema.title;
  var desc = object_schema.description;

  $input = $('<input type="text" class="form-control"></input>');
  $input.addClass("editable");
  $input.attr('name',name);
  $input.attr('id',input_id);
  $label_for = $('<label></label>');
  $label_for.attr("for",input_id);
  $label_for.text(prompt);

  $container.append($label_for);
  $container.append($input);

  if(desc){
    $input.attr('placeholder', desc);
  }
  if(required){
    $input.prop('required',true);
    $label = $("label[for='"+$input.attr('id')+"']");
    $label.append("*");
  }
}
/**
* Private class used by {@link #createFormFromSchema}. Appends a subform to append
* input
* @author Ivan Sanchez
* @param {jQuery} $container - The form container
* @param {string} The name of the input field
* @param {Object} object_schema - a JSON schema object ({@link http://json-schema.org/})
* which is utlized to append properties of the input
* @param {boolean} required- If it is a mandatory field or not.
**/
function appendObjectFormFields($container, name, object_schema) {
  $div = $('<div class="subform form-group"></div>');
  $div.attr("id", name);
  Object.keys(object_schema.properties).forEach(function(key, index) {
    if (object_schema.properties[key].type == "object") {
      // only one nested level allowed
      // therefore do nothing
    }
    else {
      appendInputFormField($div, key, object_schema.properties[key], false);
    }
  });
  $container.append($div);
}


/**
* Displays a reservation in the Reservation section.
*
* @param {Object} reservation - An associative array
* containing the reservation information
* @param {Object} flight - An associative array
* containing the flight info of the reservation
* @param {Object} template_flight - An associative array
* containing the template flight info of the reservation
* containing the flight info of the reservation
*/
function showReservation(reservation, flight, template_flight) {
  prepareReservationDataVisualization();


  // Get useful data
  var origin = template_flight.origin;
  var destination = template_flight.destination;
  var depTime = template_flight.dep_time;
  var arrTime = template_flight.arr_time;
  var depDate = flight.depDate;
  var arrDate = flight.arrDate;

  // Fill with reservation data
  $("#reservationReference").text("Reservation " + reservation.reference);
  $("#reservationFrom").text(origin);
  $("#reservationTo").text(destination);
  $("#departureTime").text("Departure: " + depDate + " at " + depTime);
  $("#arrivalTime").text("Arrival: " + arrDate + " at " + arrTime);
}



/**
* Helper method that unselects any user from the #user_list and go back to the
* initial state by hiding the "#mainContent".
**/
function deselectUser() {
  $("#user_list li.active").removeClass("active");
  $("#mainContent").hide();
}



/**
*
*/
function get_reservation_list_element(reservation_api_url) {

  var reservation;
  var flight_data;
  var template_flight_data;
  // Get the reservation data
  $.ajax({
    url: reservation_api_url,
    type: 'get'
  }).done(function (data, textStatus, jqXHR) {
    if (DEBUG) {
      console.log ("#get_reservation: RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
    }

    reservation = data;

    // Get the flight data
    flight_api_url = data["@controls"].subsection.href;
    $.ajax({
      url: flight_api_url,
      type: 'get'
    }).done(function (data, textStatus, jqXHR) {
      flight_data = data;

      // Get the associated template flight data
      template_flight_api_url = data["@controls"].subsection.href;
      $.ajax({
        url: template_flight_api_url,
        type: 'get'
      }).done(function (data, textStatus, jqXHR) {
        template_flight_data = data;

        // We now have the full flight information
        // Get the data to display in the reservation element
        var from = template_flight_data["origin"];
        var to = template_flight_data["destination"];
        var departure_date = flight_data["depDate"];

        // Append the reservation to the list
        appendReservationToList(reservation_api_url, reservation, from, to, departure_date);
      });
    });
  });
}


/**
* Sends an AJAX request to retrieve the information of a user
* Associated rel attribute: private-data
*
* ONSUCCESS =>
*  a) Extract all the links relations and its corresponding URLs (href)
*  b) Create a form and fill it with attribute data (semantic descriptors) coming
*     from the request body. The generated form should be embedded into #user_form.
*     All those tasks are performed by the method {@link #fillFormWithMasonData}
*     b.1) If "user:edit" relation exists add its href to the form action attribute.
*          In addition make the fields editables and use template to add missing
*          fields.
*  c) Add buttons to the previous generated form.
*      c.1) If "user:delete" relation exists show the #deleteUser button
*      c.2) If "user:edit" relation exists show the #editUser button
*
* ONERROR =>
*   a)Show an alert informing the user profile could not be retrieved and
*     that the data shown in the screen is not complete.
*   b)Unselect current user and go to initial state by calling {@link #deselectUser}
*
* @param {string} apiurl - The url of the User Profile instance.
**/
function user_data(apiurl){
  return $.ajax({
    url: apiurl,
    dataType:DEFAULT_DATATYPE,
  }).done(function (data, textStatus, jqXHR){
    if (DEBUG) {
      console.log ("#user_data: RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
    }
    //Extract links
    var user_links = data["@controls"];
    var schema, resource_url = null;
    if ("edit" in user_links){
      resource_url = user_links["edit"].href;
      //Extract the template value
      schema = user_links["edit"].schema;
      if (user_links["edit"].schema) {
        $form = createFormFromSchema(resource_url, schema, "edit_user_form");
        $("#editUser").show();
        fillFormWithMasonData($form, data);
      }
      else if (user_links["edit"].schemaUrl) {
        $.ajax({
          url: user_links["edit"].schemaUrl,
          dataType: DEFAULT_DATATYPE
        }).done(function (schema, textStatus, jqXHR) {
          $form = createFormFromSchema(resource_url, schema, "edit_user_form");
          $("#editUser").show();
          fillFormWithMasonData($form, data);
        }).fail(function (jqXHR, textStatus, errorThrown) {
          if (DEBUG) {
            console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
          }
          alert_error("Could not fetch form schema.  Please, try again");
        });
      }
      else {
        alert_error("Form schema not found");
      }
    }

  }).fail(function (jqXHR, textStatus, errorThrown){
    if (DEBUG) {
      console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
    }
    //Show an alert informing that I cannot get info from the user.
    alert_error("Cannot extract all the information about this user from the server");
    deselectUser();
  });
}




/**
* Sends an AJAX request to retrieve information related to a User {@link http://docs.flightreservationapp1.apiary.io/#reference/users/user}
*
* Associated link relation:self (inside the user profile)
*
*  ONSUCCESS =>
*              a) Fill basic user information: Full name and registrationdate.
*              b) Extract associated link relations from the response
*                    b.1) If user:delete: Show the #deleteUser button. Add the href
*                        to the #user_form action attribute.
*                    b.2) If user:edit: Show the #editUser button. Add the href
*                        to the #user_form action attribute.
*                    b.3) If user: data: Call the function {@link #user_data} to
*                        extract the information of the profile
*                    b.4) If user:reservations: Call the function {@link #reservations_history} to extract
*                        the reservations history of the current user.  *
*
* ONERROR =>   a) Alert the user
*              b) Unselect the user from the list and go back to initial state
*                (Call {@link deleselectUser})
*
* @author Ivan Sanchez
* @param {string} apiurl - The url of the User instance.
**/
function get_user(apiurl) {
  return $.ajax({
    url: apiurl,
    dataType:DEFAULT_DATATYPE,
    processData:false,
  }).done(function (data, textStatus, jqXHR){
    if (DEBUG) {
      console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
    }
    //Set right url to the user form
    $("#user_form").attr("action",apiurl);
    // FIll the registration date
    $("#registrationdate").val(millisToStringDate(data.registrationdate || 0));
    delete(data.registrationdate);

    //Extract user information
    var user_links = data["@controls"];
    if ("flight-booking-system:delete" in user_links){
      resource_url = user_links["flight-booking-system:delete"].href; // User delete link
      $("#deleteUser").show();
    }
    //Extracts urls from links. I need to get if the different links in the
    //response.
    if ("flight-booking-system:reservations-history" in user_links){
      var reservations_url = user_links["flight-booking-system:reservations-history"].href;
    }

    // Fill user data
    if (resource_url) {
      user_data(resource_url);
    }

    // Fill reservations history
    if (reservations_url) {
      get_user_reservations(reservations_url);
    }


  }).fail(function (jqXHR, textStatus, errorThrown){
    if (DEBUG) {
      console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
    }
    //Show an alert informing that I cannot get info from the user.
    alert_error("Cannot extract information about this user from the flight booking system service.");
    //Deselect the user from the list.
    deselectUser();
  });
}



/**
* Sends an AJAX request to add a user to the API.
* Makes use of the HTTP POST method.
* ONSUCCESS =>
*             1) Show an alert to the user to inform that user has been added
*             2) Reloads the list of all the users to display
*
* ONERROR => Displays a message to the user to inform him that
*           could not be added to the system
* @param api_url the url of the Users resource to add a new use
* @param new_user_info an associative aray containing the information
*                     of the new user to add
*/
function add_user(api_url, new_user_info) {
  $.ajax({
    url: api_url,
    type: "POST",
    data: JSON.stringify(new_user_info),
    processData:false,
    contentType: PLAINJSON
  }).done(function (data, textStatus, jqXHR){
    if (DEBUG) {
      console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
    }

    // Inform user that the user has been deleted
    alert_success("The user with has been added to the system.");

    // Update the users list from the server
    getUsers();
  }).fail(function (jqXHR, textStatus, errorThrown){
    if (DEBUG) {
      console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
    }

    // Inform the user that user has NOT been deleted
    alert_error("Error while trying to add the user to the database.");
  });
}



/**
* Sends an AJAX request to add a reservation to the API.
* Makes use of the HTTP POST method.
* ONSUCCESS => Show an alert to the user to inform that reservation has been added
*
* ONERROR => Displays a message to the user to inform him that reservation
*           could not be added to the system
* @param api_url the url of the resource to add a new reservation
* @param reservation_info an associative aray containing the information
*                     of the new reservation to add
*/
function add_reservation(api_url, reservation_info) {
  $.ajax({
    url: api_url,
    type: "POST",
    data: JSON.stringify(reservation_info),
    processData:false,
    contentType: PLAINJSON
  }).done(function (data, textStatus, jqXHR){
    if (DEBUG) {
      console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
    }

    // Inform user that the user has been deleted
    alert_success("The reservation has been added to the system.");

  }).fail(function (jqXHR, textStatus, errorThrown){
    if (DEBUG) {
      console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
    }

    // Inform the user that user has NOT been deleted
    alert_error("Error while trying to add the reservation to the database.");
  });
}



/**
* Sends an AJAX request to delete a user from the API.
* Makes use of the HTTP DELETE method.
* ONSUCCESS =>
*             1) Show an alert to the user to inform him that deletion was successful
*             2) Reloads the list of all the users to display
*
* ONERROR => Displays a message to the user to inform him that user
*           could not be deleted
* @param api_url the url of the user resource to delete
*/
function delete_user(api_url) {
  $.ajax({
    url: api_url,
    type: 'DELETE'
  }).done(function (data, textStatus, jqXHR){
    if (DEBUG) {
      console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
    }

    // Inform user that the user has been deleted
    alert_success("The user with has been deleted from the system.");

    // Update the users list from the server
    getUsers();
  }).fail(function (jqXHR, textStatus, errorThrown){
    if (DEBUG) {
      console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
    }

    // Inform the user that user has NOT been deleted
    alert_error("Error while trying to delete the user from the database.");
  });
}




/**
* Sends an AJAX request to delete a ticket from the API.
* Makes use of the HTTP DELETE method.
* ONSUCCESS =>
*             1) Show an alert to the user to inform him that deletion was successful
*             2) Reloads the list of all the users to display
*
* ONERROR => Displays a message to the user to inform him that ticket
*           could not be deleted
* @param api_url the url of the ticket resource to delete
*/
function delete_ticket(api_url) {
  $.ajax({
    url: api_url,
    type: 'DELETE'
  }).done(function (data, textStatus, jqXHR){
    if (DEBUG) {
      console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
    }

    // Inform user that the user has been deleted
    alert_success("The ticket with has been deleted from the system.");

    // Update the users list from the server
    getUsers();
  }).fail(function (jqXHR, textStatus, errorThrown){
    if (DEBUG) {
      console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
    }

    // Inform the user that user has NOT been deleted
    alert_error("Error while trying to delete the user from the database.");
  });
}



/**
* Sends an AJAX request to update the information of a user.
* Makes use of the HTTP PUT method.
*
* ONSUCCESS =>
*               1) Show an alert to the user to inform him that update was successful
*               2) Reloads the list of all users
*
* ONERROR => Displays a message to the user to inform him that user
*           data could not be updated
* @param api_url the url of the user resource to update
* @param updated_user_data an associative array containing the new
*                         information of the user
*/
function edit_user(api_url, updated_user_data) {
  $.ajax({
    url: api_url,
    type: "PUT",
    data: JSON.stringify(updated_user_data),
    processData:false,
    contentType: PLAINJSON
  }).done(function (data, textStatus, jqXHR){
    if (DEBUG) {
      console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
    }

    // Inform user that the user has been deleted
    alert_success("The user data has been successfully.");

    // Reload the list of users
    getUsers();

  }).fail(function (jqXHR, textStatus, errorThrown){
    if (DEBUG) {
      console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
    }

    // Inform the user that user has NOT been deleted
    alert_error("Error while trying to update the user data.");
  });
}



/**
* Sends an AJAX request to update the information of a ticket.
* Makes use of the HTTP PUT method.
*
* ONSUCCESS =>
*               1) Show an alert to the user to inform him that update was successful
*               2) Reloads the list of all users
*
* ONERROR => Displays a message to the user to inform him that ticket
*           data could not be updated
* @param api_url the url of the ticket resource to update
* @param updated_ticket_data an associative array containing the new
*                         information of the ticket
*/
function edit_ticket(api_url, updated_ticket_data) {
  $.ajax({
    url: api_url,
    type: "PUT",
    data: JSON.stringify(updated_ticket_data),
    processData:false,
    contentType: PLAINJSON
  }).done(function (data, textStatus, jqXHR){
    if (DEBUG) {
      console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
    }

    // Inform user that the user has been deleted
    alert_success("The ticket data has been successfully updated.");

  }).fail(function (jqXHR, textStatus, errorThrown){
    if (DEBUG) {
      console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
    }

    // Inform the user that user has NOT been deleted
    alert_error("Error while trying to update the ticket data.");
  });
}




/**
* Sends an AJAX request to get all the reservations of a user.
* Makes use of the HTTP GET method.
*
* ONSUCCESS => Displays all the reservations in a list
*
* ONERROR => Displays a message to the user to inform him that
*           data could not be obtained
* @param api_url the url of the UserReservations resource to get
*/
function get_user_reservations(api_url) {
  $.ajax({
    url: api_url,
    type: 'get'
  }).done(function(data, textStatus, jqXHR) {
    // We have the user reservations
    userReservations = data["items"];


    // If user has no reservation, show a specific message
    if (userReservations.length == 0) {
      $("#titleNoReservation").show();
      $("#titleReservationsMade").hide();
      return;
    } else {
        $("#titleReservationsMade").show();
        $("#titleNoReservation").hide();
    }

    // Set the reservations owner name
    owner = $("#user_list .active .user_link").text();
    owner = (owner.slice(-1) == "s")
    ? owner + "'"
    : owner + "'s";
    $("#reservations-owner").text(owner + " reservations");

    userReservations.forEach(function(reservation, index) {
      reservation_url = reservation["@controls"].self.href;
      get_reservation_list_element(reservation_url);
    });

  }).fail(function (jqXHR, textStatus, errorThrown) {
    alert_error("Error while trying to get the reservations of the user.");
  });
}



function appendAddTicketSection(api_url, ticket_schema_url) {
  $.ajax({
    type: 'get',

  })
}


/**
* Sends an AJAX request to get reservation tickets.
* Makes use of the HTTP GET method.
*
* ONSUCCESS => Displays the reservation tickets information
*
* ONERROR => Displays a message to the user to inform him that
*           data could not be obtained
* @param api_url the url of the ReservationTickets resource to get
*/
function get_tickets(api_url) {
  $.ajax({
    url: api_url,
    type: 'get'
  }).done(function(data, textStatus, jqXHR) {

    tickets = data.items;

    if (tickets.length == 0) {
      $("#titleReservationTickets").hide();
      $("#titleNoReservationTicket").show();
    } else {
        $("#titleReservationTickets").show();
        $("#titleNoReservationTicket").hide();
    }

    tickets.forEach(function(ticket, index) {
      /*
      * Get each ticket data and display object_schema
      */
      var ticket_url = ticket["@controls"].self.href;
      $.ajax({
        type: 'get',
        url: ticket_url
      }).done(function(data, textStatus, jqXHR) {
        appendTicket(data);
      });
    });

    var ticket_schema_url = "/flight-booking-system/schema/ticket"
    appendAddTicketSection(api_url, ticket_schema_url);
  });
}




/**
* Sends an AJAX request to get a reservation.
* Makes use of the HTTP GET method.
*
* ONSUCCESS => Displays the reservation information
*
* ONERROR => Displays a message to the user to inform him that
*           reservation could not be obtained
* @param api_url the url of the Reservation resource to get
*/
function get_reservation(api_url) {
  $.ajax({
    url: api_url,
    type: 'get'
  }).done(function(data, textStatus, jqXHR) {

    var reservation_data = data;
    $("#reservation_id").val(reservation_data["reservationid"])
    console.log("ResId = " + reservation_data["reservationid"])
    console.log("val = " + $("#reservation_id").val())
    var flight_url = reservation_data["@controls"]["subsection"]["href"];

    // Get flight information
    $.ajax({
      url: flight_url,
      type: 'get'
    }).done(function(data, textStatus, jqXHR) {

      var flight_data = data;
      var template_flight_url = flight_data["@controls"]["subsection"]["href"];

      // Get template flight information
      $.ajax({
        url: template_flight_url,
        type: 'get'
      }).done(function(data, textStatus, jqXHR) {

        // Display the reservation
        showReservation(reservation_data, flight_data, data);

        // Display the tickets of the reservation
        var reservation_tickets_url = reservation_data["@controls"]["reservation-tickets"]["href"];
        get_tickets(reservation_tickets_url);

        // Set the link to add a new ticket
        var add_ticket_url = reservation_data["@controls"]["flight-booking-system:add-ticket"].href;
        $("#btnAddTicket").closest("form").attr("action", add_ticket_url);
        $("#btnAddTicket").on("click", handleAddTicket);
        $("#addTicket").show();
        $("#addTicket input :not(#reservation_id)").val("");
      });
    });
  });
}


function add_ticket(api_url, data) {
  console.log("addTicket: res id = " + $("#reservation_id").val())
  console.log("addTicket: data = " + JSON.stringify(data))
  $.ajax({
    url: api_url,
    type: "POST",
    data: JSON.stringify(data),
    processData:false,
    contentType: PLAINJSON
  }).done(function (data, textStatus, jqXHR){
    if (DEBUG) {
      console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus);
    }

    // Inform user that the user has been deleted
    alert_success("The ticket has been added to the reservation.");

    // Update the users list from the server
    getUsers();
  }).fail(function (jqXHR, textStatus, errorThrown){
    if (DEBUG) {
      console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
    }

    // Inform the user that user has NOT been deleted
    alert_error("Error while trying to add the ticket to the database.");
  });
}


/**
* Append a new user to the #user_list. It appends a new <li> element in the #user_list
* using the information received in the arguments.
*
* @author Ivan Sanchez
* @param {string} url - The url of the User to be added to the list
* @param {string} user - The name of the user to display in the users list
* @returns {Object} The jQuery representation of the generated <li> elements.
**/
function appendUserToList(url, userName) {
  var $user = $('<li class="nav-item">').html('<a class= "user_link nav-link " href="' + url + '">'
  + '<span class="oi oi-person"></span>' + userName + '</a>');
  //Add to the user list
  $("#user_list").append($user);
  return $user;
}


/**
* Append a new reservation to the #userReservations list.
*
* @param {string} reservation_api_url - The url of the Reservation to be added to the list
* @param {Object} reservation_item - An associative array containing the information of the reservation
* @param {string} from - The origin location of the reservation
* @param {string} to - The destination location of the reservation
* @param {string} departure_date - The departure date of the reservation
**/
function appendReservationToList(reservation_api_url, reservation_item, from, to, departure_date) {
  var $reservations_list = $("#reservationsList");

  var res_id = "res-" + reservation_item["reservation_id"];
  var $reservation_item = $("<div id='" + res_id + "' class='card'>"
      + " <p class='lead'>"
      +   from
      + " <img class='plane-reservation-element-icon' src='img/ic_flight_right.png' />"
      +   to
      + " </p>"
      + " <span class='pull-left'><strong>" + departure_date + "</strong></span>"
      + " <br/>"
      + " <span class='pull-left reservation-reference'><strong>" + reservation_item["reference"] + "</strong></span>"
      + " <div class='text-right'>"
      + "   <button class='btn btn-primary btn-view-reservation' href='" + reservation_api_url + "'>View</a>"
      + " </div>"
      + "</div>");

      // Add to the reservation list
      $("#reservationsList").append($reservation_item);
      $(".btn-view-reservation").on("click", handleGetReservation);
}


/**
* Append a new ticket to the #ticketsList list.
*
* @param {Object} ticket - An associative array containing the information of the ticket
**/
function appendTicket(ticket) {

  var ticket_links = ticket["@controls"];
  var resource_url = ticket_links.self.href;

  // Create the form id for ticket
  var form_id = 'ticket-' + ticket.ticket_id;

  // Declare a variable for the form to create
  var $form = $("<form action='#' id='" + form_id + "'></form>").appendTo("#ticketsList");
  $form.append("<div class='form_content'></div>")

  // Create a form for th ticket and fill it
  if (ticket_links["edit"].schema) {
    // Get the ticket schema
    var ticket_schema = ticket_links["edit"].schema;
    $form = createFormFromSchema(resource_url, ticket_schema, form_id);
    fillFormWithMasonData($form, ticket);
  }
  else if (ticket_links["edit"].schemaUrl) {
    $.ajax({
      url: ticket_links["edit"].schemaUrl,
      dataType: DEFAULT_DATATYPE
    }).done(function (schema, textStatus, jqXHR) {
      $form = createFormFromSchema(resource_url, schema, form_id);
      fillFormWithMasonData($form, ticket);
    }).fail(function (jqXHR, textStatus, errorThrown) {
      if (DEBUG) {
        console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown);
      }
      alert_error("Could not fetch form schema.  Please, try again");
    });
  }
  else {
    alert_error("Form schema not found");
  }

  // Add the form
  $("#ticketsList").append($form);
  $("#reservation form").addClass("card");

  // Add buttons to edit and delete ticket
  var $container = $("<div class='pull-right'></div>").appendTo($form);
  var $btnEdit = $("<button class='btn btn-primary btn-ticket' href='" + resource_url + "'>Edit</button>").appendTo($container);
  var $btnDelete = $("<button class='btn btn-primary btn-ticket' href='" + resource_url + "'>Delete</button>").appendTo($container);
  $btnEdit.on("click", handleEditTicket);
  $btnDelete.on("click", handleDeleteTicket);
}



/**
* Helper method to visualize the form to create a new user (#new_user_form)
* It hides current user information and purge old data still in the form. It
* also shows the #createUser button.
* @author Ivan Sanchez
**/
function showNewUserForm () {
  //Remove selected users in the sidebar
  deselectUser();

  //Hide the user data, show the newUser div and reset the form
  $("#userData").hide();
  var form =  $("#new_user_form")[0];
  form.reset();
  // Show butons
  $("input[type='button']",form).show();

  $("#newUser").show();
  //Be sure that #mainContent is visible.
  $("#mainContent").show();
}






/**** BUTTON HANDLERS ****/

/**
* Shows in #mainContent the #new_user_form. Internally it calls to {@link #showNewUserForm}
*
* TRIGGER: #addUserButton
**/
function handleShowUserForm(event){
  if (DEBUG) {
    console.log ("Triggered handleShowUserForm");
  }
  //Show the form. Note that the form was updated when I apply the user collection
  showNewUserForm();
  return false;
}



/**
* Uses the API to delete the currently active user.
*
* TRIGGER: #deleteUser
**/
function handleDeleteUser(event){
  //Extract the url of the resource from the form action attribute.
  if (DEBUG) {
    console.log ("Triggered handleDeleteUser");
  }

  var userurl = $(this).closest("form").attr("action");
  delete_user(userurl);
  return false;
}

/**
* Uses the API to update the user's profile with the form attributes in the present form.
*
* TRIGGER: #editUser
**/
function handleEditUser(event){
  //Extract the url of the resource from the form action attribute.
  if (DEBUG) {
    console.log ("Triggered handleEditUser");
  }
  var $form = $(this).closest("form");
  var body = serializeFormTemplate($form);
  var user_url = $(this).closest("form").attr("action");
  edit_user(user_url, body);
  return false;
}


function handleEditTicket(event){
  //Extract the url of the resource from the form action attribute.
  if (DEBUG) {
    console.log ("Triggered handleEditUser");
  }
  var $form = $(this).closest("form");
  var body = serializeFormTemplate($form);
  var ticket_url = $(this).closest("form").attr("action");
  edit_ticket(ticket_url, body);
  return false;
}



function handleDeleteTicket(event){
  //Extract the url of the resource from the form action attribute.
  if (DEBUG) {
    console.log ("Triggered handleDeleteUser");
  }

  var ticket_url = $(this).closest("form").attr("action");
  delete_ticket(ticket_url);
  return false;
}



/**
* Uses the API to create a new user with the form attributes in the present form.
*
* TRIGGER: #createUser
**/
function handleCreateUser(event){
  if (DEBUG) {
    console.log ("Triggered handleCreateUser");
  }
  var $form = $(this).closest("form");
  var template = serializeFormTemplate($form);
  var url = $form.attr("action");
  add_user(url, template);
  return false; //Avoid executing the default submit
}



/**
* Uses the API to retrieve reservation's information
* from the clicked reservation.
**/
function handleGetReservation(event) {
  prepareReservationDataVisualization();
  if (DEBUG) {
    console.log ("Triggered handleGetReservation");
  }

  event.preventDefault();

  var reservation_url = $(this).attr("href");
  get_reservation(reservation_url);

  // Important to not reload the page
  return false;
}


/**
* Uses the API to retrieve user's information from the clicked user. In addition,
* this function modifies the active user in the #user_list (removes the .active
* class from the old user and add it to the current user)
*
* TRIGGER: click on #user_list li a
**/
function handleGetUser(event) {
  if (DEBUG) {
    console.log ("Triggered handleGetUser");
  }

  event.preventDefault();
  $("#user_list li").removeClass("active");

  // Make the user element 'active' visually
  $(this).parent().addClass("active");

  prepareUserDataVisualization();

  var url = $(this).attr("href");
  get_user(url);

  return;
}



function handleAddTicket(event) {
  if (DEBUG) {
    console.log ("Triggered handleAddTicket");
  }
  var $form = $(this).closest("form");
  var template = serializeFormTemplate($form);
  var url = $form.attr("action");
  add_ticket(url, template);
  return false; //Avoid executing the default submit
}


/***** UTIL FUNCTION *****/

/**
* Gets the full name (first name + last name) of a user
*/
function getFullName(user) {
  return user.firstName + " " + user.lastName;
}


function millisToStringDate(millis) {
  var date = new Date(millis);

  // dd.MM.YYYY hh:mm
  return addZeroIfLowerThanTen(date.getDate()) + "."
  + addZeroIfLowerThanTen(date.getMonth() + 1) + "."
  + date.getFullYear() + " "
  + addZeroIfLowerThanTen(date.getHours()) + ":"
  + addZeroIfLowerThanTen(date.getMinutes());
}

function addZeroIfLowerThanTen(digit) {
  if (digit >= 0 && digit < 10) {
    return "0" + digit;
  } else {
    return digit;
  }
}


/**
* Populate a form with the content in the param <i>data</i>.
* Each data parameter is going to fill one <input> field. The name of each parameter
* is the <input> name attribute while the parameter value attribute represents
* the <input> value. All parameters are by default assigned as
* <i>readonly</i>.
*
* NOTE: All buttons in the form are hidden. After executing this method adequate
*       buttons should be shown using $(#button_name).show()
*
* @author Ivan Sanchez
* @param {jQuery} $form - The form to be filled in
* @param {Object} data - An associative array formatted using Mason format ({@link https://tools.ietf.org/html/draft-kelly-json-hal-07})
**/

function fillFormWithMasonData($form, data) {

  $(".form_content", $form).children("input").each(function() {
    if (data[this.id]) {
      $(this).attr("value", data[this.id]);
    }
  });

  $(".form_content", $form).children(".subform").children("input").each(function() {
    var parent = $(this).parent()[0];
    if (data[parent.id][this.id]) {
      $(this).attr("value", data[parent.id][this.id]);
    }
  });
}



/**
* Serialize the input values from a given form (jQuery instance) into a
* JSON document.
*
* @author Ivan Sanchez
* @param {Object} $form - a jQuery instance of the form to be serailized
* @returs {Object} An associative array in which each form <input> is converted
* into an element in the dictionary.
**/
function serializeFormTemplate($form){
  var envelope={};
  // get all the inputs into an array.
  var $inputs = $form.find(".form_content input");
  $inputs.each(function() {
    envelope[this.id] = $(this).val();
  });

  var subforms = $form.find(".form_content .subform");
  subforms.each(function() {

    var data = {}

    $(this).children("input").each(function() {
      data[this.id] = $(this).val();
    });

    envelope[this.id] = data
  });
  return envelope;
}


/**
* Helper method to be called before showing new user data information
* It purges old user's data and hide all buttons in the user's forms (all forms
* elements inside teh #userData)
*
**/
function prepareUserDataVisualization() {

  //Remove all children from form_content
  $("#userProfile .form_content").empty();
  //Hide buttons
  $("#userData .commands input[type='button'").hide();
  //Reset all input in userData
  $("#userData input[type='text']").val("??");
  //Remove old messages
  $("#reservationsList").empty();
  $("#ticketsList").empty();
  // Hide section for one reservations
  //Be sure that the newUser form is hidden
  $("#newUser").hide();
  //Be sure that user information is shown
  $("#userData").show();
  $("#userData").children().show();
  $("#reservation").hide();
  $("#addTicket").hide();
  //Be sure that mainContent is shown
  $("#mainContent").show();
}



function prepareReservationDataVisualization() {

  $("#userHeader").hide();
  $("#userProfile").hide();
  $("#userReservations").hide();
  $("#newUser").hide();
  $("#reservation").show();
  $("#ticketsList").empty();
  $("#addTicket").show();
}


/***** NOTIFICATIONS FUNCTIONS *****/

function alert_success(message) {
  Lobibox.notify('success', {
    delayIndicator: false,
    msg: message
  });
}


function alert_error(message) {
  Lobibox.notify('error', {
    delayIndicator: false,
    msg: message
  });
}


$(function() {
  // When document is ready


  $("#addUserButton").on("click",  handleShowUserForm);
  $("#deleteUser").on("click", handleDeleteUser);
  $("#editUser").on("click", handleEditUser);
  $("#createUser").on("click", handleCreateUser);

  $("#user_list").on("click", "li a", handleGetUser);

  $.get({
    url: 'localhost:5000/flight-booking-system/api/users',
    success: function() { alert("Test Success") }
  });
  getUsers(ENTRYPOINT);
})
