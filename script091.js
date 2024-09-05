	/* refactored version 0.9.1 */
	
	
// -------------------- MAIN INITIALIZATION --------------------

$(document).ready(function () {
	

	// -------------------- DATA INITIALIZATION --------------------

	// Course data object and specific activity types
	let courseData = {
		name: "",
		creditHours: 1,
		goal: "",
		description: "",
		learningOutcomes: [],
		units: []
	};

	// Specific activities grouped by type
	const specificActivities = {
		acquisition: ["reading", "watching video", "listening to audio", "other"],
		practice: ["exercises", "tests & quizzes", "exam", "drills", "games", "simulations & role plays", "other"],
		investigation: ["research project", "fieldwork", "case study", "problem-based learning", "data analysis", "experiment", "lab"],
		reflection: ["journaling", "discussion", "portfolio", "exit takeaway", "reflective essay", "feedback", "survey", "exam"],
		production: ["writing", "presentation", "drawing", "experiment", "coding", "prototyping", "model design", "concept map", "portfolio", "project", "exam"],
		discussion: ["discussion", "debate", "think-pair-share", "socratic seminar", "peer feedback", "commentary", "other"],
		cooperation: ["social bookmarking", "blog", "wiki", "image sharing", "podcast", "demo", "document sharing", "other"],
		collaboration: ["group project", "study group", "discussion", "conference", "wiki", "peer review", "brainstorming", "role playing", "other"],
		other: ["other"]
	};

	// Activity colors mapped by type
	const activityColours = {
		acquisition: 'salmon',
		practice: 'pink',
		investigation: 'orange',
		reflection: 'gold',
		production: 'thistle',
		discussion: 'lightgreen',
		cooperation: 'lightblue',
		collaboration: 'lightcoral',
		other: 'wheat'
	};

	// Quill editors for rich text editing
	let quillEditors = {};

	// -------------------- END DATA INITIALIZATION --------------------

	// -------------------- QUILL EDITOR INITIALIZATION --------------------

	// Initialize a single Quill editor
	function initializeQuillEditor(selector) {
		return new Quill(selector, {
			theme: 'snow',
			modules: {
				toolbar: [
					[{ 'header': [1, 2, 3, false] }],
					['bold', 'italic', 'underline'],
					['link', 'blockquote', 'code-block'],
					[{ 'list': 'ordered' }, { 'list': 'bullet' }],
					['clean']
				]
			}
		});
	}

	// Initialize all Quill editors within the page
	function initializeQuillEditors() {
		$('.quill-editor').each(function () {
			let editorId = $(this).attr('id');
			quillEditors[editorId] = initializeQuillEditor('#' + editorId);
		});
	}

	// -------------------- END QUILL EDITOR INITIALIZATION --------------------


	// -------------------- EVENT LISTENERS --------------------

	// Event listener for saving course information (triggered when editing course info)
	
	   // Event listener for the Save/Load button (assuming it has an ID of "save-load-menu")
    $('#save-load-menu').on('click', function () {
        showSaveLoadPopup(); // Call the function to show the save/load popup
    });
	
	$('#save-course-info').on('click', function () {
		courseData.name = $('#course-name').val();
		courseData.creditHours = parseInt($('#course-credit-hours').val());
		courseData.goal = $('#course-goal').val();
		courseData.description = quillEditors['course-description-editor'].root.innerHTML; // Save Quill content
		saveLearningOutcomes(); // Save updated learning outcomes
		saveCourseToLocalStorage(); // Save to local storage
		closePopup(); // Close the popup window
		updateCourseHeader(); // Refresh course header info
		renderPieChart(); // Refresh the activity type chart
	});

	// Event listener for creating a new unit (opens the "Create New Unit" popup)
	$('#create-new-unit').on('click', function () {
		showNewUnitPopup(); // Show the form for creating a new unit
	});

	// Event listener for loading course data
	$('#load-course').on('click', function () {
		$('#load-course-file').click(); // Opens file picker to load course data
	});

	$('#load-course-file').on('change', function (event) {
		let file = event.target.files[0];
		if (file) {
			let reader = new FileReader();
			reader.onload = function (e) {
				try {
					courseData = JSON.parse(e.target.result); // Parse the loaded course data
					updateCourseHeader(); // Update course info on page
					renderPieChart(); // Render pie chart
					renderUnits(); // Render units and activities
					saveCourseToLocalStorage(); // Save to local storage
					closePopup(); // Close popup after load
				} catch (err) {
					alert('Failed to load course data: Invalid JSON format.');
				}
			};
			reader.readAsText(file); // Read the file content
		}
	});

	// Event listener for clearing all course data
	$('#clear-course-data').on('click', function () {
		if (confirm('Are you sure you want to clear all course data?')) {
			clearCourseData(); // Clear course and reset page
		}
	});

	// Event listener for saving course to HTML
	$('#save-html').on('click', function () {
		saveCourseToHTML(); // The function to save the course as HTML
	});

	// Event listener for exporting course to PDF
	$('#export-pdf').on('click', function () {
		saveCourseToPDF(); // The function to export the course to PDF
	});

	// Event listener for copying course data to clipboard
	$('#copy-clipboard').on('click', function () {
		copyToClipboard(); // The function to copy course data to clipboard
	});

	// Event listener for the "Add Learning Outcome" button (adds a new learning outcome)
	$('#add-learning-outcome').on('click', function () {
		courseData.learningOutcomes.push(''); // Add a blank learning outcome
		updateLearningOutcomesUI(); // Refresh the learning outcomes UI
	});

	// Event listener for editing units
	$(document).on('click', '.edit-unit', function () {
		let unitIndex = $(this).closest('.unit-panel').data('index');
		editUnit(unitIndex); // Open the edit unit popup
	});

	// Event listener for deleting units
	$(document).on('click', '.delete-unit', function () {
		let unitIndex = $(this).closest('.unit-panel').data('index');
		deleteUnit(unitIndex); // Delete the selected unit
	});

	// Event listener for saving an activity (inside the edit activity form)
	$(document).on('click', '#save-activity', function () {
		let unitIndex = $(this).data('unit-index');
		let activityIndex = $(this).data('activity-index');
		saveActivity(unitIndex, activityIndex); // Save changes made to an activity
	});

	// Event listener for cloning activities
	$(document).on('click', '.clone-activity', function () {
		let unitIndex = $(this).closest('.unit-panel').data('index');
		let activityIndex = $(this).closest('.activity-card').data('index');
		cloneActivity(unitIndex, activityIndex); // Clone the selected activity
	});

	// Event listener for deleting activities
	$(document).on('click', '.delete-activity', function () {
		let unitIndex = $(this).closest('.unit-panel').data('index');
		let activityIndex = $(this).closest('.activity-card').data('index');
		deleteActivity(unitIndex, activityIndex); // Delete the selected activity
	});

	// Event listener for moving activities left
	$(document).on('click', '.move-left', function () {
		let activityCard = $(this).closest('.activity-card');
		moveActivityCardWithButton(activityCard, 'left'); // Move activity left
	});

	// Event listener for moving activities right
	$(document).on('click', '.move-right', function () {
		let activityCard = $(this).closest('.activity-card');
		moveActivityCardWithButton(activityCard, 'right'); // Move activity right
	});

	// Event listener to show the course info popup (used for editing course information)
	$('#edit-course-info').on('click', function () {
		showCourseInfoPopup(); // Open the popup to edit course information
	});

	// Event listener to handle activity type selection and show the new activity popup
	$('#learning-activity-menu').on('change', function () {
		let activityType = $(this).val();
		if (activityType) {
			showNewLearningActivityPopup(activityType); // Open popup for adding a new activity
		}
		$(this).val(''); // Reset the selection after activity creation
	});

	// Event listener to close any popup when the "Cancel" button is clicked
	$(document).on('click', '.close-popup', function () {
		closePopup(); // Close any active popup
	});

	// Add event listeners for toggling
	$(document).on('click', '#course-info h2', function() {
		toggleCourseInfo();
	});

	$(document).on('click', '#colour-key-container h2', function() {
		toggleActivityKey();
	});

	// -------------------- END EVENT LISTENERS --------------------


	// -------------------- SORTABLE FUNCTIONALITY --------------------

	// Sortable functionality for units
	function initializeUnitSortable() {
		$('#course-container').sortable({
			items: '.unit-panel',
			axis: 'y',
			handle: '.unit-title',
			placeholder: 'unit-placeholder',
			update: function () {
				updateUnitOrder();
			}
		}).disableSelection();
	}

	// Sortable functionality for activities within units
	function initializeActivitySortable() {
		$('.activities-container').sortable({
			connectWith: '.activities-container',
			placeholder: 'activity-placeholder',
			tolerance: 'pointer',
			helper: 'clone',
			start: function (event, ui) {
				ui.item.data('start-unit-index', ui.item.closest('.unit-panel').data('index'));
				ui.item.data('start-index', ui.item.index());
			},
			stop: function (event, ui) {
				let movedActivityCard = ui.item;
				let newUnitIndex = movedActivityCard.closest('.unit-panel').data('index');
				let oldUnitIndex = movedActivityCard.data('start-unit-index');
				let newIndex = movedActivityCard.index();
				updateActivityOrder(movedActivityCard, oldUnitIndex, newUnitIndex, newIndex);
			}
		}).disableSelection();
	}

	// -------------------- END SORTABLE FUNCTIONALITY --------------------





	// -------------------- RENDER FUNCTIONS --------------------

	// Render the list of units and activities
	function renderUnits() {
		$('#course-container').empty();

		courseData.units.forEach((unit, unitIndex) => {
			let unitPanel = $(`
				<div class="unit-panel" data-index="${unitIndex}" style="background-color: lightgrey; margin-bottom: 20px; padding: 20px; border-radius: 8px; position: relative;">
					<div class="unit-header" style="display: flex; justify-content: space-between; align-items: center;">
						<div class="unit-title" style="cursor: move; font-size: 18px; font-weight: bold;">${unit.title}</div>
						<div class="unit-buttons" style="position: absolute; top: 10px; right: 10px;">
							<button class="edit-unit" title="Edit Unit" style="border: none; background: none; cursor: pointer; margin-right: 5px;">
								🖋️
							</button>
							<button class="delete-unit" title="Delete Unit" style="border: none; background: none; cursor: pointer;">
								❌
							</button>
						</div>
					</div>
					<div class="unit-description">${unit.description}</div>
					<div class="unit-duration">Total Duration: ${calculateUnitDuration(unit)}</div>
					<div class="unit-outcomes">Learning Outcomes: </div>
					<h3>Unit activities:</h3>
					<div class="activities-container" data-unit-index="${unitIndex}"></div>
				</div>
			`);

			// Append activities to the unit
			unit.activities.forEach((activity, activityIndex) => {
				let activityCardHtml = renderActivityCard(activity, activityIndex, unitIndex);
				unitPanel.find('.activities-container').append(activityCardHtml);
			});

			$('#course-container').append(unitPanel);
		});

		initializeActivitySortable(); // Reinitialize sortable to maintain sorting ability
		addActivityCardListeners(); // Reattach listeners
		addUnitPanelListeners(); // Reattach unit panel listeners
		calculateDurations(); // Ensure course durations are updated
	}


	// Render a single activity card
	function renderActivityCard(activity, activityIndex, unitIndex) {
		let color = activityColours[activity.type] || 'gray';
		const outcomeNumbers = activity.outcomes.map(i => i + 1).join('; '); // Use semicolon to separate
		const truncatedDescription = truncateText(activity.description, 10); // Truncate the description to 10 words

		// Check if the activity is assessed and display additional fields if true
		let assessedInfo = activity.assessed ? `
			<div>Required: ${activity.required ? 'Yes' : 'No'}</div>
			<div>Pass Mark: ${activity.passMark || 'N/A'}%</div>
			<div>Weighting: ${activity.weighting || 'N/A'}%</div>
			<div>Marking Hours: ${activity.markingHours || 'N/A'}</div>
		` : '';

		// Render the activity card with buttons for moving, cloning, editing, and deleting
		return `
			<div class="activity-card" data-activity-id="${activity.id}" data-index="${activityIndex}" data-unit-index="${unitIndex}" style="background-color: ${color}; width: 275px; height: 270px; padding: 10px; position: relative;">
				<div style="font-weight: bold; margin-bottom: 5px;">${activity.title}</div>
				<div class="description">${truncatedDescription}</div>
				<div>Type: ${activity.specificType || "N/A"}</div>
				<div>Duration: ${activity.duration || "N/A"}</div>
				<div>Assessed: ${activity.assessed ? 'Yes' : 'No'}</div>
				${assessedInfo}
				<div>Outcomes: ${outcomeNumbers}</div>
				${activity.assessed ? '<span class="star" style="position: absolute; top: 10px; right: 10px; color: gold;" title="assessed">★</span>' : ''}
				<div class="activity-buttons" style="position: absolute; bottom: 10px; right: 10px;">
					<button class="move-left">←</button>
					<button class="move-right">→</button>
					<button class="edit-activity" title="Edit">🖋️</button>
					<button class="clone-activity" title="Clone">📋</button>
					<button class="delete-activity" title="Delete">❌</button>
				</div>
			</div>
		`;
	}

	// -------------------- RENDER PIE CHART --------------------

// Variable to store the chart instance
let activityChartInstance;

// Function to display a pie chart of activity types
function renderPieChart(variation = 'ordinal') {
    // Initialize data structures
    let activityCounts = {};
    let activityDurations = {};

    // Initialize counts and durations for each type
    for (let type in activityColours) {
        activityCounts[type] = 0;
        activityDurations[type] = 0;
    }

    // Populate counts and durations from course data
    courseData.units.forEach(unit => {
        unit.activities.forEach(activity => {
            const type = activity.type;
            const duration = parseDurationToMinutes(activity.duration || "0:00");

            // Increment counts and durations for each activity type
            activityCounts[type] = (activityCounts[type] || 0) + 1;
            activityDurations[type] = (activityDurations[type] || 0) + duration;
        });
    });

    // Prepare data for the chart
    let labels = [];
    let data = [];
    let backgroundColor = [];

    // Depending on the variation, we either use counts or durations for the pie chart
    for (let type in activityColours) {
        if (variation === 'ordinal' && activityCounts[type] > 0) {
            labels.push(type);
            data.push(activityCounts[type]);
            backgroundColor.push(activityColours[type]);
        } else if (variation === 'proportional' && activityDurations[type] > 0) {
            labels.push(type);
            data.push(activityDurations[type]);
            backgroundColor.push(activityColours[type]);
        }
    }

    // Clear the existing chart if it exists
    if (activityChartInstance) {
        activityChartInstance.destroy();
    }

    // Create the pie chart using Chart.js
    const ctx = document.getElementById('activityPieChart').getContext('2d');
    activityChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColor
            }]
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            if (variation === 'ordinal') {
                                return `${label}: ${value} activities`;
                            } else {
                                let hours = Math.floor(value / 60);
                                let minutes = value % 60;
                                return `${label}: ${hours}h ${minutes}m`;
                            }
                        }
                    }
                }
            }
        }
    });

    // Display the color key
    initializeColourKey();
}
// Function to initialize the color key for activity types
function initializeColourKey() {
    let colourkeyHtml = '<div id="colour-key" style="display: flex; justify-content: space-around; padding: 10px 0; background-color: #f5f5f5; margin-bottom: 10px;">';
    colourkeyHtml += "<strong>Activity Type Key: </strong>";
    for (let type in activityColours) {
        let activitiesList = specificActivities[type].join(', ');
        colourkeyHtml += `
            <div style="flex: 1; text-align: center;" title="${activitiesList}">
                <span style="display: inline-block; width: 20px; height: 20px; background-color: ${activityColours[type]}; margin-right: 5px;"></span>
                <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </div>
        `;
    }
    colourkeyHtml += '</div>';
    $('#colour-key-container').html(colourkeyHtml);
    return colourkeyHtml;
}


	// -------------------- END RENDER FUNCTIONS --------------------


	// -------------------- CRUD OPERATIONS --------------------

	// -------------- ACTIVITIES --------------
	
	// -------------------- ADD ACTIVITY CARD LISTENERS --------------------

	// Function to add listeners to each activity card (edit, delete, move, clone)
	function addActivityCardListeners() {
		// Handle editing an activity
		$('.edit-activity').off('click').on('click', function () {
			const activityCard = $(this).closest('.activity-card');
			const unitPanel = activityCard.closest('.unit-panel');
			const unitIndex = unitPanel.data('index');
			const activityIndex = activityCard.data('index');
			editActivity(unitIndex, activityIndex);
		});

		// Handle cloning an activity
		$('.clone-activity').off('click').on('click', function () {
			const activityCard = $(this).closest('.activity-card');
			const unitPanel = activityCard.closest('.unit-panel');
			const unitIndex = unitPanel.data('index');
			const activityIndex = activityCard.data('index');
			cloneActivity(unitIndex, activityIndex);
		});

		// Handle deleting an activity
		$('.delete-activity').off('click').on('click', function () {
			const activityCard = $(this).closest('.activity-card');
			const unitPanel = activityCard.closest('.unit-panel');
			const unitIndex = unitPanel.data('index');
			const activityIndex = activityCard.data('index');
			deleteActivity(unitIndex, activityIndex);
		});

		// Handle moving an activity left
		$('.move-left').off('click').on('click', function (e) {
			e.stopPropagation();
			const activityCard = $(this).closest('.activity-card');
			moveActivityCardWithButton(activityCard, 'left');
		});

		// Handle moving an activity right
		$('.move-right').off('click').on('click', function (e) {
			e.stopPropagation();
			const activityCard = $(this).closest('.activity-card');
			moveActivityCardWithButton(activityCard, 'right');
		});
	}

	// -------------------- SHOW NEW LEARNING ACTIVITY POPUP --------------------

	function showNewLearningActivityPopup(activityType) {
		if (!checkUnitsExist()) {
			alert("You must create at least one unit before you can add an activity.");
			showNewUnitPopup();
			return; // Exit the function if there are no units
		}

		$('#popup').html(`
			<div style="padding: 20px;">
				<label>Activity Title: <input type="text" id="activity-title" style="width: 90%;"></label><br><br>
				<label>Activity Description:</label>
				<div id="activity-description-editor" style="height: 100px; background: #fff;"></div><br><br>
				<label>Specific Activity:
					<select id="specific-activity" style="width: 92%;">
						${specificActivities[activityType].map(activity => `<option value="${activity}">${activity}</option>`).join('')}
						<option value="new">Add new...</option>
					</select>
				</label><br><br>
				<label>Anticipated Study Time (hours:minutes or minutes): <input type="text" id="activity-duration" placeholder="00:00" style="width: 90%;"></label><br><br>
				<label>Assessed: <input type="checkbox" id="activity-assessed"></label><br><br>
				<div id="assessment-fields" style="display: none;">
					<label>Required: <input type="checkbox" id="activity-required"></label><br><br>
					<label>Pass Mark (%): <input type="number" id="activity-pass-mark" min="0" max="100" step="1"></label><br><br>
					<label>Weighting (%): <input type="number" id="activity-weighting" min="0" max="100" step="1"></label><br><br>
					<label>Marking Hours: <input type="number" id="activity-marking-hours" min="0" step="0.1"></label><br><br>
				</div>
				<label>Learning Outcomes:</label><br>
				<div style="max-height: 150px; overflow-y: auto;">
					${courseData.learningOutcomes.map((outcome, index) => `
						<div><input type="checkbox" class="learning-outcome-checkbox" data-index="${index}"> ${index + 1}. ${outcome}</div>
					`).join('')}
				</div><br>
				<label>Select Unit:
					<select id="select-unit" style="width: 92%;">
						${courseData.units.map((unit, index) => `<option value="${index}">${unit.title}</option>`).join('')}
					</select>
				</label><br><br>
				<button id="create-activity">Create Activity</button>
				<button class="close-popup">Cancel</button>
			</div>
		`).addClass('active');

		// Initialize Quill editor for the activity description
		let quill = new Quill('#activity-description-editor', {
			theme: 'snow'
		});

		// Event listener for selecting specific activity
		$('#specific-activity').on('change', function () {
			if ($(this).val() === 'new') {
				let newActivity = prompt("Enter new specific activity:");
				if (newActivity) {
					specificActivities[activityType].push(newActivity);
					$(this).append(`<option value="${newActivity}">${newActivity}</option>`);
					$(this).val(newActivity);
				}
			}
		});

		// Show/hide additional fields based on the assessed checkbox
		$('#activity-assessed').on('change', function () {
			if ($(this).is(':checked')) {
				$('#assessment-fields').show();
			} else {
				$('#assessment-fields').hide();
			}
		});

		// Event listener for creating a new activity
		$('#create-activity').on('click', function () {
			let activityTitle = $('#activity-title').val();
			let activityDescription = quill.root.innerHTML; // Get the rich text content from Quill
			let activityDuration = $('#activity-duration').val();
			let activityAssessed = $('#activity-assessed').is(':checked');
			let specificType = $('#specific-activity').val();
			let selectedOutcomes = [];
			$('.learning-outcome-checkbox:checked').each(function () {
				selectedOutcomes.push($(this).data('index'));
			});
			let unitIndex = $('#select-unit').val();

			// Additional assessment fields
			let required = $('#activity-required').is(':checked');
			let passMark = $('#activity-pass-mark').val() ? parseInt($('#activity-pass-mark').val()) : null;
			let weighting = $('#activity-weighting').val() ? parseFloat($('#activity-weighting').val()) : null;
			let markingHours = $('#activity-marking-hours').val() ? parseFloat($('#activity-marking-hours').val()) : null;

			if (activityTitle && unitIndex !== null) {
				activityDuration = parseDuration(activityDuration);
				createNewActivity(activityType, activityTitle, activityDescription, activityDuration, activityAssessed, specificType, selectedOutcomes, unitIndex, required, passMark, weighting, markingHours);
				closePopup();
			}
		});

		// Event listener to close popup
		$('.close-popup').on('click', function () {
			closePopup();
		});
	}

	// Function to create a new activity
	function createNewActivity(type, title, description, duration, assessed, specificType, outcomes, unitIndex, required = false, passMark = null, weighting = null, markingHours = null) {
		let newActivity = {
			id: generateNewActivityId(),
			type: type,
			title: title,
			description: description,
			duration: duration,
			assessed: assessed,
			specificType: specificType,
			outcomes: outcomes,
			required: required,
			passMark: passMark,
			weighting: weighting,
			markingHours: markingHours
		};

		// Add the new activity to the specified unit
		courseData.units[unitIndex].activities.push(newActivity);
		reindexActivities(unitIndex); // Reindex activities after adding
		renderUnits(); // Rerender the UI
		saveCourseToLocalStorage(); // Save the updated course data to local storage
		initializeActivitySortable(); // Reinitialize sortable behavior
		addActivityCardListeners(); // Reattach event listeners
		calculateDurations(); // Recalculate the durations for each unit
	}

	// Function to edit an existing activity
	function editActivity(unitIndex, activityIndex) {
		const activity = courseData.units[unitIndex].activities[activityIndex];
		if (!activity) {
			console.error('Error: Activity not found');
			return;
		}
		$('#popup').html(`
			<div style="padding: 20px;">
				<label>Activity Title: <input type="text" id="edit-activity-title" value="${activity.title}" style="width: 90%;"></label><br><br>
				<label>Activity Description:</label>
				<div id="edit-activity-description-editor" class="quill-editor" style="height: 100px;"></div><br>
				<label>Specific Activity:
					<select id="edit-specific-activity" style="width: 92%;">
						${specificActivities[activity.type].map(activityType => `<option value="${activityType}" ${activityType === activity.specificType ? 'selected' : ''}>${activityType}</option>`).join('')}
						<option value="new">Add new...</option>
					</select>
				</label><br><br>
				<label>Anticipated study time (hours:minutes or minutes): <input type="text" id="edit-activity-duration" value="${activity.duration}" style="width: 90%;"></label><br><br>
				<label>Assessed: <input type="checkbox" id="edit-activity-assessed" ${activity.assessed ? 'checked' : ''}></label><br><br>
				<div id="edit-assessment-details" style="display: ${activity.assessed ? 'block' : 'none'};">
					<label>Required: <input type="checkbox" id="edit-activity-required" ${activity.required ? 'checked' : ''}></label><br><br>
					<label>Pass Mark (%): <input type="number" id="edit-activity-pass-mark" value="${activity.passMark || ''}" min="0" max="100" style="width: 90%;"></label><br><br>
					<label>Weighting (%): <input type="number" id="edit-activity-weighting" value="${activity.weighting || ''}" min="0" max="100" style="width: 90%;"></label><br><br>
					<label>Marking Hours: <input type="number" step="0.1" id="edit-activity-marking-hours" value="${activity.markingHours || ''}" min="0" step="0.1" style="width: 90%;"></label><br><br>
				</div>
				<label>Learning Outcomes:</label><br>
				<div style="max-height: 150px; overflow-y: auto;">
					${courseData.learningOutcomes.map((outcome, index) => `
						<div><input type="checkbox" class="edit-learning-outcome-checkbox" data-index="${index}" ${activity.outcomes.includes(index) ? 'checked' : ''}> ${index + 1}. ${outcome}</div>
					`).join('')}
				</div><br>
				<button id="save-activity">Save</button>
				<button class="close-popup">Cancel</button>
			</div>
		`).addClass('active');

		initializeQuillEditors();
		quillEditors['edit-activity-description-editor'].root.innerHTML = activity.description; // Load existing content into Quill

		$('#edit-activity-assessed').on('change', function () {
			if ($(this).is(':checked')) {
				$('#edit-assessment-details').show();
			} else {
				$('#edit-assessment-details').hide();
			}
		});

		// Save the updated activity
		$('#save-activity').on('click', function () {
			activity.title = $('#edit-activity-title').val();
			activity.description = quillEditors['edit-activity-description-editor'].root.innerHTML; // Get the Quill editor content
			activity.duration = $('#edit-activity-duration').val();
			activity.assessed = $('#edit-activity-assessed').is(':checked');
			activity.required = $('#edit-activity-required').is(':checked');
			activity.passMark = $('#edit-activity-pass-mark').val();
			activity.weighting = $('#edit-activity-weighting').val();
			activity.markingHours = $('#edit-activity-marking-hours').val();
			activity.outcomes = [];
			$('.edit-learning-outcome-checkbox:checked').each(function () {
				activity.outcomes.push($(this).data('index'));
			});

			saveCourseToLocalStorage(); // Save changes to local storage
			renderUnits(); // Rerender the units
			closePopup(); // Close the popup
		});

		$('.close-popup').on('click', function () {
			closePopup();
		});
	}

	// Function to delete an activity
	function deleteActivity(unitIndex, activityIndex) {
		const unit = courseData.units[unitIndex];
		if (confirm('Are you sure you want to delete this activity?')) {
			unit.activities.splice(activityIndex, 1); // Remove activity from the array
			renderUnits(); // Re-render the units
			saveCourseToLocalStorage(); // Save changes to local storage
			calculateDurations(); // Recalculate durations after activity deletion
		}
	}

	// Function to clone an activity
	function cloneActivity(unitIndex, activityIndex) {
		let activityToClone = courseData.units[unitIndex].activities[activityIndex];
		let clonedActivity = JSON.parse(JSON.stringify(activityToClone)); // Create a deep copy
		clonedActivity.id = generateNewActivityId(); // Generate a new ID for the cloned activity
		courseData.units[unitIndex].activities.splice(activityIndex + 1, 0, clonedActivity); // Insert cloned activity
		renderUnits(); // Rerender the units
		saveCourseToLocalStorage(); // Save changes to local storage
		calculateDurations(); // Recalculate durations
	}
	
	function saveActivity(unitIndex, activityIndex = null) {
		// Get activity data from the form inputs
		let activityTitle = $('#edit-activity-title').val();
		let activityDescription = quillEditors['edit-activity-description-editor'].root.innerHTML; // Get the rich text content from Quill
		let activityDuration = $('#edit-activity-duration').val();
		let activityAssessed = $('#edit-activity-assessed').is(':checked');
		let specificType = $('#edit-specific-activity').val();
		let selectedOutcomes = [];
	
		$('.edit-learning-outcome-checkbox:checked').each(function () {
			selectedOutcomes.push($(this).data('index'));
		});

		// Additional assessment fields
		let required = $('#edit-activity-required').is(':checked');
		let passMark = $('#edit-activity-pass-mark').val() ? parseInt($('#edit-activity-pass-mark').val()) : null;
		let weighting = $('#edit-activity-weighting').val() ? parseFloat($('#edit-activity-weighting').val()) : null;
		let markingHours = $('#edit-activity-marking-hours').val() ? parseFloat($('#edit-activity-marking-hours').val()) : null;

		// Check if the activity is being edited or newly created
		if (activityIndex !== null) {
			// Update the existing activity
			const activity = courseData.units[unitIndex].activities[activityIndex];
			activity.title = activityTitle;
			activity.description = activityDescription;
			activity.duration = activityDuration;
			activity.assessed = activityAssessed;
			activity.specificType = specificType;
			activity.outcomes = selectedOutcomes;
			activity.required = required;
			activity.passMark = passMark;
			activity.weighting = weighting;
			activity.markingHours = markingHours;
		} else {
			// Create a new activity
			let newActivity = {
				id: generateNewActivityId(), // Ensure each new activity has a unique ID
				type: $('#activity-type').val(), // Get the activity type from the form
				title: activityTitle,
				description: activityDescription,
				duration: activityDuration,
				assessed: activityAssessed,
				specificType: specificType,
				outcomes: selectedOutcomes,
				required: required,
				passMark: passMark,
				weighting: weighting,
				markingHours: markingHours
			};

			// Add the new activity to the correct unit
			courseData.units[unitIndex].activities.push(newActivity);
		}

		// Save changes to local storage and re-render the units
		saveCourseToLocalStorage();
		renderUnits();
		closePopup();
		calculateDurations(); // Update course and unit durations
	}



	// -------------- UNITS --------------
	
	// -------------------- ADD UNIT PANEL LISTENERS --------------------

	// Function to add listeners to each unit panel (edit, delete)
	function addUnitPanelListeners() {
		// Handle editing a unit
		$('.edit-unit').off('click').on('click', function () {
			const unitIndex = $(this).closest('.unit-panel').data('index');
			editUnit(unitIndex);
		});

		// Handle deleting a unit
		$('.delete-unit').off('click').on('click', function () {
			const unitIndex = $(this).closest('.unit-panel').data('index');
			if (confirm('Are you sure you want to delete this unit? This will also delete all its activities.')) {
				courseData.units.splice(unitIndex, 1);
				renderUnits();
				saveCourseToLocalStorage(); // Save changes to local storage
				addUnitPanelListeners(); // Re-attach listeners
				addActivityCardListeners(); // Re-attach listeners for activities
				calculateDurations(); // Recalculate the durations after deletion
			}
		});
	}

	// -------------------- SHOW NEW UNIT POPUP --------------------

	function showNewUnitPopup() {
		// Create the HTML content for the popup, including input fields for unit title and description
		$('#popup').html(`
			<div style="padding: 20px;">
				<label>Unit Title: <input type="text" id="unit-title" style="width: 90%;"></label><br><br>
				<label>Unit Description:</label>
				<div id="unit-description-editor" style="height: 150px;"></div><br><br>
				<button id="create-unit">Create Unit</button>
				<button class="close-popup">Cancel</button>
			</div>
		`).addClass('active');

		// Initialize the Quill editor for the unit description
		var quill = new Quill('#unit-description-editor', {
			theme: 'snow' // You can use 'bubble' theme as well if preferred
		});

		// Event listener for creating a new unit when "Create Unit" button is clicked
		$('#create-unit').on('click', function () {
			let unitTitle = $('#unit-title').val();
			let unitDescription = quill.root.innerHTML; // Get the HTML content from the Quill editor

			if (unitTitle) {
				createNewUnit(unitTitle, unitDescription); // Create the new unit and save data
				closePopup(); // Close the popup
			} else {
				alert('Please enter a title for the unit.'); // Error message if title is missing
			}
		});

		// Event listener for closing the popup when "Cancel" button is clicked
		$('.close-popup').on('click', function () {
			closePopup();
		});
	}

	// Function to create a new unit
	function createNewUnit(title, description) {
		let newUnit = {
			title: title,
			description: description,
			activities: []
		};
		courseData.units.push(newUnit); // Add the new unit to course data
		renderUnits(); // Rerender the units
		initializeActivitySortable(); // Re-initialize sortable for activities
		addActivityCardListeners(); // Add listeners for activity card buttons
		calculateDurations(); // Calculate unit durations
		saveCourseToLocalStorage(); // Save to local storage
	}

	// Function to edit an existing unit
	function editUnit(unitIndex) {
		const unit = courseData.units[unitIndex];
		$('#popup').html(`
			<div style="padding: 20px;">
				<label>Unit Title: <input type="text" id="edit-unit-title" value="${unit.title}" style="width: 90%;"></label><br><br>
				<label>Unit Description:</label>
				<div id="edit-unit-description-editor" style="height: 150px;"></div><br><br>
				<button id="save-unit">Save</button>
				<button class="close-popup">Cancel</button>
			</div>
		`).addClass('active');

		let quill = new Quill('#edit-unit-description-editor', {
			theme: 'snow' // Initialize the Quill editor for unit description
		});
		quill.root.innerHTML = unit.description; // Set the existing description in the editor

		$('#save-unit').on('click', function () {
			unit.title = $('#edit-unit-title').val();
			unit.description = quill.root.innerHTML; // Get the HTML content from Quill
			saveCourseToLocalStorage(); // Save changes to local storage
			renderUnits(); // Rerender the units
			initializeActivitySortable(); // Reinitialize sortable after editing
			closePopup(); // Close the popup
		});

		$('.close-popup').on('click', function () {
			closePopup();
		});
	}

	// Function to delete a unit
	function deleteUnit(unitIndex) {
		if (confirm('Are you sure you want to delete this unit? This will also delete all its activities.')) {
			courseData.units.splice(unitIndex, 1); // Remove the unit from course data
			renderUnits(); // Rerender the units
			saveCourseToLocalStorage(); // Save changes to local storage
			calculateDurations(); // Recalculate durations
		}
	}


	// -------------------- UPDATE COURSE HEADER --------------------

	function updateCourseHeader() {
		// Get the course name, goal, description, and credit hours from courseData
		const courseName = courseData.name || "Untitled Course";
		const courseGoal = courseData.goal || "";
		const courseDescription = courseData.description || "";
		const courseCreditHours = courseData.creditHours || "";
		const learningOutcomes = courseData.learningOutcomes || [];

		// Calculate the total duration of the course (in minutes)
		let totalCourseMinutes = 0;
		courseData.units.forEach(unit => {
			unit.activities.forEach(activity => {
				if (activity.duration && activity.duration !== "N/A") {
					let [hours, minutes] = activity.duration.split(":").map(Number);
					totalCourseMinutes += (hours * 60) + minutes;
				}
			});
		});

		// Convert total minutes to hours and minutes for display
		let totalCourseHours = Math.floor(totalCourseMinutes / 60);
		let remainingMinutes = totalCourseMinutes % 60;
		let totalDurationText = `${totalCourseHours}h ${remainingMinutes}m`;

		// Create a numbered list of learning outcomes
		let outcomesHtml = '<ol id="learning-outcomes-list">';
		learningOutcomes.forEach(outcome => {
			outcomesHtml += `<li>${outcome}</li>`;
		});
		outcomesHtml += '</ol>';

		// Create the HTML structure for the course details, including the pie chart canvas
		const courseDetails = `
			<h3 class="shrink-children">${courseName} <span style="font-size: small;">(click to expand/shrink course information)</span></h3>
			<div id="basic-info">
				<div id="details">
					<p><strong>Credits:</strong> ${courseCreditHours}</p>
					<p><strong>Goal:</strong> ${courseGoal}</p>
					<p><strong>Description:</strong> ${courseDescription}</p>
				</div>
				<p id="learning-outcomes-display"><strong>Course learning outcomes:</strong> ${outcomesHtml}</p>
			</div>
			<p id="total-course-duration">
				<strong>Total Course Study Hours:</strong> ${totalDurationText}
			</p>
			<div id="pie-chart-container">
				<canvas id="activityPieChart" width="250" height="250"></canvas>
			</div>
		`;

		// Update the course header display in the DOM
		$('#course-details-display').html(courseDetails);

		// Now call the function to render the pie chart
		renderPieChart('proportional');
	}

	// -------------------- EDIT COURSE INFO POPUP --------------------

	// Function to display and edit course information
	function showCourseInfoPopup() {
		// Build the HTML for the popup with existing course data
		$('#popup').html(`
			<div style="padding: 20px;">
				<label>Course Name: <input type="text" id="course-name" value="${courseData.name}" style="width: 90%;"></label><br><br>
				<label>Credit Hours: <input type="number" id="course-credit-hours" min="1" max="15" value="${courseData.creditHours}" style="width: 90%;"></label><br><br>
				<label>Course Goal:</label><textarea id="course-goal" style="width: 90%; height: 60px;">${courseData.goal}</textarea><br><br>
				<label>Course Description:</label>
				<div id="course-description-editor" style="height: 100px;"></div><br>
				<label>Learning Outcomes:</label><br>
				<div id="learning-outcomes-container" style="max-height: 150px; overflow-y: auto; width: 90%;"></div><br>
				<button id="add-learning-outcome">Add Learning Outcome</button><br><br>
				<button id="save-course-info">Save</button>
				<button class="close-popup">Cancel</button>
			</div>
		`).addClass('active');

		// Initialize Quill editor for course description
		let quill = new Quill('#course-description-editor', {
			theme: 'snow'
		});
		quill.root.innerHTML = courseData.description;

		// Load the current learning outcomes into the popup
		updateLearningOutcomesUI();

		// Event listener for adding a new learning outcome
		$('#add-learning-outcome').on('click', function () {
			courseData.learningOutcomes.push('');
			updateLearningOutcomesUI();
		});

		// Event listener for saving the course info
		$('#save-course-info').on('click', function () {
			courseData.name = $('#course-name').val();
			courseData.creditHours = parseInt($('#course-credit-hours').val());
			courseData.goal = $('#course-goal').val();
			courseData.description = quill.root.innerHTML; // Get the updated HTML from Quill editor
			saveLearningOutcomes();
			saveCourseToLocalStorage(); // Save changes to local storage
			updateCourseHeader(); // Update the course header display
			closePopup(); // Close the popup
		});

		// Event listener for closing the popup
		$('.close-popup').on('click', function () {
			closePopup();
		});
	}
	
	// -------------------- UPDATE LEARNING OUTCOMES UI --------------------

	// Function to display learning outcomes in the popup
	function updateLearningOutcomesUI() {
		$('#learning-outcomes-container').empty();
		courseData.learningOutcomes.forEach((outcome, index) => {
			$('#learning-outcomes-container').append(`
				<div>
					<textarea class="learning-outcome" data-index="${index}" style="width: 85%;">${outcome}</textarea>
					<button class="delete-learning-outcome" data-index="${index}">x</button>
				</div>
			`);
		});

		// Event listener for deleting a learning outcome
		$('.delete-learning-outcome').on('click', function () {
			let index = $(this).data('index');
			if (confirm('Are you sure you want to delete this learning outcome?')) {
				courseData.learningOutcomes.splice(index, 1);
				updateLearningOutcomesUI();
			}
		});

		// Event listener for updating a learning outcome
		$('.learning-outcome').on('input', function () {
			let index = $(this).data('index');
			courseData.learningOutcomes[index] = $(this).val();
		});
	}

	// -------------------- SAVE LEARNING OUTCOMES --------------------

	// Function to save learning outcomes from the popup to courseData
	function saveLearningOutcomes() {
		courseData.learningOutcomes = [];
		$('.learning-outcome').each(function () {
			courseData.learningOutcomes.push($(this).val());
		});
	}




	// -------------------- END CRUD OPERATIONS --------------------





	// -------------------- SAVE AND LOAD OPERATIONS --------------------

	// -------------------- Save and Load Course Data --------------------

	function showSaveLoadPopup() {
		// Create the popup HTML content
		const popupContent = `
			<div class="popup-content">
				<h3>Save/Load Options</h3>
				<button id="save-course">Save Course</button>
				<button id="load-course">Load Course</button>
				<input type="file" id="load-course-file" style="display: none;">
				<button id="export-html">Export to HTML</button>
				<button id="export-pdf">Export to PDF</button>
				<button id="copy-clipboard">Copy to Clipboard</button>
				<button class="close-popup">Close</button>
			</div>
		`;

		// Display the popup
		$('#popup').html(popupContent).addClass('active');

		// Event listeners for Save/Load actions inside the popup
		$('#save-course').on('click', function () {
			saveCourseToFile();
		});
	
		$('#load-course').on('click', function () {
			$('#load-course-file').click(); // Simulate a click on the file input element
		});

		$('#load-course-file').on('change', function (event) {
			loadCourseFromFile(event); // Call the function to load the course from the selected file
		});

		$('#export-html').on('click', function () {
			saveCourseToHTML();
		});

		$('#export-pdf').on('click', function () {
			saveCourseToPDF();
		});

		$('#copy-clipboard').on('click', function () {
			copyToClipboard();
		});

		$('.close-popup').on('click', function () {
			closePopup();
		});
	}


	// Function to save course data to local storage
	function saveCourseToLocalStorage() {
		try {
			localStorage.setItem('courseData', JSON.stringify(courseData));
			console.log("Course data saved to localStorage.");
		} catch (error) {
			console.error("Error saving course data to localStorage: ", error);
		}
	}

	// Function to load course data from local storage
	function loadCourseFromLocalStorage() {
		try {
			const storedData = localStorage.getItem('courseData');
			if (storedData) {
				courseData = JSON.parse(storedData);
				updateCourseHeader();
				renderUnits();
				renderPieChart();
				calculateDurations();
				initializeActivitySortable();
				addActivityCardListeners();
				console.log("Course data loaded from localStorage.");
			} else {
				console.log("No saved course data found in localStorage.");
			}
		} catch (error) {
			console.error("Error loading course data from localStorage: ", error);
		}
	}
	
	function saveCourseToFile() {
		const courseDataStr = JSON.stringify(courseData, null, 2); // Convert courseData to JSON string
		const blob = new Blob([courseDataStr], { type: "application/json" }); // Create a Blob with the JSON data
		const url = URL.createObjectURL(blob); // Create an object URL for the Blob

		const a = document.createElement('a'); // Create an anchor element
		a.href = url; // Set the URL to the Blob
		a.download = `${courseData.name.replace(/\s+/g, '_')}_course_data.json`; // Set the default file name
		a.click(); // Trigger a download by simulating a click on the anchor element

		URL.revokeObjectURL(url); // Revoke the object URL to free up memory
	}
	function loadCourseFromFile(event) {
		const file = event.target.files[0]; // Get the uploaded file from the input
		if (!file) {
			alert('No file selected.');
			return;
		}

		const reader = new FileReader(); // Create a new FileReader to read the file

		reader.onload = function(e) {
			try {
				const courseDataFromFile = JSON.parse(e.target.result); // Parse the loaded file as JSON
				courseData = courseDataFromFile; // Replace the current courseData with the loaded data
				updateCourseHeader(); // Update the UI with the new course data
				renderUnits(); // Render the course units with the new data
				initializeActivitySortable(); // Initialize sortable activities
				addActivityCardListeners(); // Add event listeners to activity cards
				calculateDurations(); // Recalculate the total course durations
				renderPieChart(); // Update the pie chart with the new data
				alert('Course loaded successfully!');
			} catch (error) {
				alert('Failed to load course: Invalid JSON file.');
				console.error('Error loading course:', error);
			}
		};

		reader.readAsText(file); // Read the file as text
	}


	// -------------------- Export Course to HTML --------------------

	// Function to export the course to an HTML file
	function saveCourseToHTML() {
		let htmlContent = `<!DOCTYPE html>
		<html lang="en">
		<head>
			<title>${courseData.name} - Course Report</title>
			<style>
				body { font-family: Arial, sans-serif; }
				h1 { font-size: 24px; }
				h2, h3 { font-size: 18px; }
				p { font-size: 14px; }
				.activity { margin-bottom: 20px; padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd; }
				.activity h3 { margin-top: 0; }
				.activity-type { font-weight: bold; }
				.duration { font-style: italic; }
			</style>
		</head>
		<body>
			<h1>Course Report: ${courseData.name}</h1>
			<p><strong>Credit Hours:</strong> ${courseData.creditHours}</p>
			<p><strong>Goal:</strong> ${courseData.goal}</p>
			<p><strong>Description:</strong> ${courseData.description}</p>
		
			<h2>Learning Outcomes</h2>
			<ol>
				${courseData.learningOutcomes.map((outcome, index) => `<li>${outcome}</li>`).join('')}
			</ol>
		
			<h2>Units</h2>`;

		courseData.units.forEach((unit, unitIndex) => {
			htmlContent += `<h3>Unit ${unitIndex + 1}: ${unit.title}</h3>
							<p>${unit.description}</p>
							<p><strong>Total Duration:</strong> ${calculateUnitDuration(unit)}</p>
							<p><strong>Activities:</strong></p>
							<ul>`;
		
			unit.activities.forEach(activity => {
				htmlContent += `<li class="activity">
									<h4>${activity.title}</h4>
									<p class="activity-type">${activity.specificType}</p>
									<p class="duration">Duration: ${activity.duration || "N/A"}</p>
									<p>Assessed: ${activity.assessed ? 'Yes' : 'No'}</p>
									${activity.assessed ? `
										<p>Required: ${activity.required ? 'Yes' : 'No'}</p>
										<p>Pass Mark: ${activity.passMark || 'N/A'}%</p>
										<p>Weighting: ${activity.weighting || 'N/A'}%</p>
										<p>Marking Hours: ${activity.markingHours || 'N/A'}</p>
									` : ''}
								</li>`;
			});

			htmlContent += '</ul>';
		});

		// Include summary stats and the pie chart for activity types
		const proportionalData = preparePieChartData('proportional');
		const proportionalSVG = generatePieChartSVG(proportionalData, 'proportional');

		htmlContent += `
			<h2>Summary Statistics</h2>
			<p><strong>Total Marking Hours:</strong> ${calculateTotalMarkingHours()}</p>
			<p><strong>Unassessed Learning Outcomes:</strong> ${getUnassessedLearningOutcomes().join(', ') || "All assessed"}</p>
		
			<h2>Activity Type Distribution (Proportional)</h2>
			${proportionalSVG}
		</body>
		</html>`;

		// Create a Blob and save the HTML file
		let blob = new Blob([htmlContent], { type: "text/html" });
		let url = URL.createObjectURL(blob);
		let a = document.createElement('a');
		a.href = url;
		a.download = "Course_Report.html";
		a.click();
		URL.revokeObjectURL(url);
	}

	// -------------------- Export Course to PDF --------------------

	// Function to export the course to a PDF file
	function saveCourseToPDF() {
	
	    const { jsPDF } = window.jspdf;
	    const doc = new jsPDF();
	
		doc.setFontSize(12);
		doc.text(`Course Name: ${courseData.name}`, 10, 10);
		doc.text(`Credit Hours: ${courseData.creditHours}`, 10, 20);
		doc.text(`Course Goal: ${courseData.goal}`, 10, 30);
		doc.text(`Description: ${courseData.description}`, 10, 40);
		doc.text("Learning Outcomes:", 10, 50);

		let y = 60;
		courseData.learningOutcomes.forEach((outcome, index) => {
			doc.text(`${index + 1}. ${outcome}`, 10, y);
			y += 10;
		});

		doc.text("Units:", 10, y);
		y += 10;

		courseData.units.forEach((unit, unitIndex) => {
			doc.text(`Unit ${unitIndex + 1}: ${unit.title}`, 10, y);
			y += 10;
			doc.text(`Description: ${unit.description}`, 10, y);
			y += 10;
			doc.text(`Total Duration: ${calculateUnitDuration(unit)}`, 10, y);
			y += 10;

			unit.activities.forEach((activity) => {
				doc.text(`- ${activity.title} (${activity.specificType})`, 10, y);
				y += 10;
				doc.text(`  Duration: ${activity.duration || "N/A"}`, 10, y);
				y += 10;



				if (activity.assessed) {
					doc.text(`  Assessed: Yes`, 10, y);
					y += 10;
					doc.text(`  Required: ${activity.required ? "Yes" : "No"}`, 10, y);
					y += 10;
					doc.text(`  Pass Mark: ${activity.passMark || "N/A"}%`, 10, y);
					y += 10;
					doc.text(`  Weighting: ${activity.weighting || "N/A"}%`, 10, y);
					y += 10;
					doc.text(`  Marking Hours: ${activity.markingHours || "N/A"}`, 10, y);
					y += 10;
				}
			});

			y += 10;
			if (y > 280) {
				doc.addPage();
				y = 10;
			}
		});

		// Summary Section
		doc.text("Summary Statistics", 10, y);
		y += 10;
		doc.text(`Total Marking Hours: ${calculateTotalMarkingHours()}`, 10, y);
		y += 10;
		const unassessedOutcomes = getUnassessedLearningOutcomes();
		doc.text(`Unassessed Learning Outcomes: ${unassessedOutcomes.length ? unassessedOutcomes.join(', ') : "All assessed"}`, 10, y);
	
		doc.save('Course_Report.pdf');
	}

	// -------------------- Copy Course Info to Clipboard --------------------

	// Function to copy course details to the clipboard
	function copyToClipboard() {
		let text = `Course Name: ${courseData.name}\n`;
		text += `Credit Hours: ${courseData.creditHours}\n`;
		text += `Course Goal: ${courseData.goal}\n`;
		text += `Course Description: ${courseData.description}\n\n`;
	
		text += `Learning Outcomes:\n${courseData.learningOutcomes.map((outcome, index) => `${index + 1}. ${outcome}`).join('\n')}\n\n`;

		text += `Units:\n`;
		courseData.units.forEach((unit, unitIndex) => {
			text += `Unit ${unitIndex + 1}: ${unit.title}\n`;
			text += `Description: ${unit.description}\n`;
			text += `Total Duration: ${calculateUnitDuration(unit)}\n`;
			text += `Activities:\n`;
			unit.activities.forEach(activity => {
				text += `- ${activity.title} (${activity.specificType})\n`;
				text += `  Duration: ${activity.duration || "N/A"}\n`;
				text += `  Assessed: ${activity.assessed ? 'Yes' : 'No'}\n`;
				if (activity.assessed) {
					text += `  Required: ${activity.required ? "Yes" : "No"}\n`;
					text += `  Pass Mark: ${activity.passMark || "N/A"}%\n`;
					text += `  Weighting: ${activity.weighting || "N/A"}%\n`;
					text += `  Marking Hours: ${activity.markingHours || "N/A"}\n`;
				}
				text += '\n';
			});
		});

		const unassessedOutcomes = getUnassessedLearningOutcomes();
		text += `\nUnassessed Learning Outcomes: ${unassessedOutcomes.length ? unassessedOutcomes.join(', ') : "All outcomes assessed"}\n`;

		navigator.clipboard.writeText(text).then(() => {
			alert('Course details copied to clipboard!');
		}).catch((err) => {
			console.error('Failed to copy text: ', err);
		});
	}

	// -------------------- END SAVE AND LOAD OPERATIONS --------------------

	// -------------------- UTILITY FUNCTIONS --------------------


	// -------------------- PIE CHART DATA PREPARATION --------------------

	// Function to prepare data for generating pie charts
	function preparePieChartData(chartType) {
		const activityCounts = {};     // For ordinal chart (count activities)
		const activityDurations = {};  // For proportional chart (sum durations)

		// Initialize the counts and durations for each activity type
		Object.keys(activityColours).forEach(type => {
			activityCounts[type] = 0;
			activityDurations[type] = 0;
		});

		// Loop through the units and activities to accumulate counts or durations
		courseData.units.forEach(unit => {
			unit.activities.forEach(activity => {
				const type = activity.type;
				const duration = parseDurationToMinutes(activity.duration || "0:00");

				activityCounts[type]++;
				activityDurations[type] += duration;
			});
		});

		// Return the correct data based on the chart type
		if (chartType === 'ordinal') {
			return Object.keys(activityCounts).map(type => ({
				type: type,
				value: activityCounts[type]
			}));
		} else if (chartType === 'proportional') {
			return Object.keys(activityDurations).map(type => ({
				type: type,
				value: activityDurations[type]
			}));
		}
	}

	// -------------------- SVG PIE CHART GENERATION --------------------

	// Function to generate an SVG pie chart based on the data
	function generatePieChartSVG(data, chartType) {
		const diameter = 300; // Chart size
		const radius = diameter / 2;
		const padding = 10;

		const totalValue = data.reduce((sum, d) => sum + d.value, 0);

		let svgContent = `<svg width="${diameter + padding * 2}" height="${diameter + padding * 2}" xmlns="http://www.w3.org/2000/svg">
						  <g transform="translate(${radius + padding},${radius + padding})">`;

		let cumulativeAngle = 0;
		data.forEach((d, index) => {
			const percentage = d.value / totalValue;
			const sliceAngle = percentage * Math.PI * 2;
			const x = Math.cos(cumulativeAngle) * radius;
			const y = Math.sin(cumulativeAngle) * radius;

			cumulativeAngle += sliceAngle;

			const x2 = Math.cos(cumulativeAngle) * radius;
			const y2 = Math.sin(cumulativeAngle) * radius;

			const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

			const pathData = `
				M 0 0
				L ${x} ${y}
				A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
				Z
			`;

			svgContent += `<path d="${pathData}" fill="${activityColours[d.type]}" stroke="#fff" stroke-width="1"></path>`;
		});

		svgContent += `</g></svg>`;
		return svgContent;
	}

	// -------------------- CALCULATE TOTAL MARKING HOURS --------------------

	// Function to calculate the total marking hours for the course
	function calculateTotalMarkingHours() {
		let totalMarkingHours = 0;
		courseData.units.forEach(unit => {
			unit.activities.forEach(activity => {
				if (activity.assessed) {
					totalMarkingHours += parseFloat(activity.markingHours) || 0;
				}
			});
		});
		return totalMarkingHours.toFixed(2);  // Return as a string with two decimal places
	}

	// -------------------- GET UNASSESSED LEARNING OUTCOMES --------------------

	// Function to get unassessed learning outcomes
	function getUnassessedLearningOutcomes() {
		const assessedOutcomes = new Set();

		// Collect all assessed outcomes from the activities
		courseData.units.forEach(unit => {
			unit.activities.forEach(activity => {
				if (activity.assessed) {
					activity.outcomes.forEach(outcomeIndex => {
						assessedOutcomes.add(outcomeIndex);
					});
				}
			});
		});

		// Return the outcomes that have not been assessed
		return courseData.learningOutcomes.filter((outcome, index) => !assessedOutcomes.has(index));
	}


	// Utility function to convert duration in "hh:mm" format to total minutes
	function parseDurationToMinutes(duration) {
		const [hours, minutes] = duration.split(":").map(Number);
		return (hours * 60) + minutes;
	}



	// Function to truncate text to a specified number of words
	function truncateText(text, wordLimit) {
		const words = text.split(' ');
		if (words.length > wordLimit) {
			return words.slice(0, wordLimit).join(' ') + '...';
		}
		return text;
	}

	// Function to parse duration input
	function parseDuration(input) {
		if (!input || isNaN(input.replace(":", ""))) {
			return "N/A";
		}
		let [hours, minutes] = input.includes(":") ? input.split(":").map(Number) : [0, parseInt(input)];
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
	}

	// Function to generate a unique ID for activities
	function generateNewActivityId() {
		return 'activity-' + Math.random().toString(36).substr(2, 9);
	}

	// -------------------- CLOSE POPUP --------------------

	// Function to close the popup and clear its content
	function closePopup() {
		$('#popup').removeClass('active').empty();
	}

	function checkUnitsExist() {
		// Check if there are any units defined in the courseData
		return courseData.units && courseData.units.length > 0;
	}
	
	function findActivityById(unitIndex, activityId) {
		const unit = courseData.units[unitIndex];
		if (!unit) {
			console.error(`Unit with index ${unitIndex} not found`);
			return null;
		}

		const activity = unit.activities.find(activity => activity.id === activityId);
		if (!activity) {
			console.error(`Activity with ID ${activityId} not found in unit ${unitIndex}`);
			return null;
		}

		return activity;
	}


	function moveActivityCardWithButton(activityCard, direction) {
		let unitPanel = activityCard.closest('.unit-panel');
		let unitIndex = unitPanel.data('index');
		let activityIndex = activityCard.index();

		if (direction === 'left') {
			if (activityIndex > 0) {
				// Move the activity left (up) within the same unit
				let activities = courseData.units[unitIndex].activities;
				[activities[activityIndex - 1], activities[activityIndex]] = [activities[activityIndex], activities[activityIndex - 1]];
				renderUnits();
				initializeActivitySortable(); // Reinitialize sortable to maintain sorting ability
				addActivityCardListeners(); // Reattach listeners
			} else if (unitIndex > 0) {
				// Move the activity to the last position of the previous unit
				let previousUnit = $('.unit-panel').eq(unitIndex - 1);
				let activities = courseData.units[unitIndex].activities;
				let activityToMove = activities.splice(activityIndex, 1)[0];
				courseData.units[unitIndex - 1].activities.push(activityToMove);
				renderUnits();
				initializeActivitySortable(); // Reinitialize sortable to maintain sorting ability
				addActivityCardListeners(); // Reattach listeners
			}
		} else if (direction === 'right') {
			let activities = courseData.units[unitIndex].activities;
			if (activityIndex < activities.length - 1) {
				// Move the activity right (down) within the same unit
				[activities[activityIndex], activities[activityIndex + 1]] = [activities[activityIndex + 1], activities[activityIndex]];
				renderUnits();
				initializeActivitySortable(); // Reinitialize sortable to maintain sorting ability
				addActivityCardListeners(); // Reattach listeners
			} else if (unitIndex < courseData.units.length - 1) {
				// Move the activity to the first position of the next unit
				let nextUnit = $('.unit-panel').eq(unitIndex + 1);
				let activityToMove = activities.splice(activityIndex, 1)[0];
				courseData.units[unitIndex + 1].activities.unshift(activityToMove);
				renderUnits();
				initializeActivitySortable(); // Reinitialize sortable to maintain sorting ability
				addActivityCardListeners(); // Reattach listeners
			}
		}

		// Save the updated state after moving
		saveCourseToLocalStorage();
		calculateDurations();
	}

	function updateActivityOrder(movedActivityCard, oldUnitIndex, newUnitIndex, newIndex) {
		let activityId = movedActivityCard.data('activity-id');
		let movedActivity = findActivityById(oldUnitIndex, activityId);

		if (movedActivity) {
			// Remove the activity from the old unit
			courseData.units[oldUnitIndex].activities = courseData.units[oldUnitIndex].activities.filter(a => a.id !== activityId);

			// Add the activity to the new unit at the correct index
			courseData.units[newUnitIndex].activities.splice(newIndex, 0, movedActivity);

			// Re-render the updated units and save changes
			renderUnits();
			saveCourseToLocalStorage();
			calculateDurations();
		}
	}



	// -------------------- CALCULATE DURATIONS --------------------

	function calculateDurations() {
		let totalCourseMinutes = 0; // Initialize total minutes for the entire course

		// Loop through each unit to calculate the total duration of activities within the unit
		courseData.units.forEach((unit, unitIndex) => {
			let unitMinutes = 0; // Initialize total minutes for this unit

			// Loop through each activity in the unit
			unit.activities.forEach(activity => {
				if (activity && activity.duration && activity.duration !== "N/A") {
					// Convert the duration (formatted as hh:mm) into minutes
					let [hours, minutes] = activity.duration.split(":").map(Number);
					unitMinutes += (hours * 60) + minutes;
				}
			});

			// Display the total duration for the unit
			$(`.unit-panel[data-index=${unitIndex}] .unit-duration`).text(`Total Duration: ${Math.floor(unitMinutes / 60)}h ${unitMinutes % 60}m`);

			totalCourseMinutes += unitMinutes; // Add the unit's duration to the total course duration
		});

		// Display the total duration for the entire course
		$('#total-course-duration').html(`Total Study Hours: ${Math.floor(totalCourseMinutes / 60)}h ${totalCourseMinutes % 60}m`);
	}

	function reindexActivities(unitIndex) {
		// Get the unit by index
		const unit = courseData.units[unitIndex];

		// Loop through the activities in the unit and assign new indices
		unit.activities.forEach((activity, activityIndex) => {
			activity.index = activityIndex; // Update the index of the activity
		});

		// Update the DOM with the new indices
		$(`.unit-panel[data-index='${unitIndex}'] .activity-card`).each(function (activityIndex) {
			$(this).data('index', activityIndex); // Update the DOM with the new activity index
		});
	}
	// Function to toggle visibility of course information
	function toggleCourseInfo() {
		const courseInfoElement = $('#course-info-content');
	
		// Toggle the visibility using jQuery slide animation
		if (courseInfoElement.is(':visible')) {
			courseInfoElement.slideUp();  // Hide
		} else {
			courseInfoElement.slideDown(); // Show
		}
	}

	// Function to toggle visibility of the activity key
	function toggleActivityKey() {
		const activityKeyElement = $('#colour-key-content');
	
		// Toggle the visibility using jQuery slide animation
		if (activityKeyElement.is(':visible')) {
			activityKeyElement.slideUp();  // Hide
		} else {
			activityKeyElement.slideDown(); // Show
		}
	}

    // Function to toggle visibility of a given element
    function toggleVisibility(selector) {
        const element = $(selector);
        if (element.is(':visible')) {
            element.hide();
        } else {
            element.show();
        }
    }

    // Add event listeners for toggling visibility
    function addEventListeners() {
        $('#toggle-course-info').on('click', function () {
            toggleVisibility('#course-info');
        });

        $('#toggle-color-key').on('click', function () {
            toggleVisibility('#colour-key-container');
        });
    }

    // Toggle visibility for the course info section
    $('#edit-course-info').on('click', function () {
        toggleVisibility('#course-info');
    });

    // Toggle visibility for the color key section
    $('#toggle-color-key').on('click', function () {
        toggleVisibility('#colour-key-container');
    });

	// Initialize the course information and activity key sections (collapsed by default)
	function initializeCollapsibleSections() {
		$('#course-info-content').hide();  // Start hidden
		$('#colour-key-content').hide();   // Start hidden
	}

	document.addEventListener('DOMContentLoaded', function () {
		// Toggles the visibility of the course information
		function toggleCourseInfoVisibility() {
			const courseInfo = document.getElementById('course-info');
			if (courseInfo.style.display === 'none' || !courseInfo.style.display) {
				courseInfo.style.display = 'block';
			} else {
				courseInfo.style.display = 'none';
			}
		}

		// Toggles the visibility of the activity type key
		function toggleActivityKeyVisibility() {
			const activityKey = document.getElementById('activity-key');
			if (activityKey.style.display === 'none' || !activityKey.style.display) {
				activityKey.style.display = 'block';
			} else {
				activityKey.style.display = 'none';
			}
		}

		// Attach event listeners to the toggle links
		document.getElementById('toggle-course-info').addEventListener('click', function (event) {
			event.preventDefault();
			toggleCourseInfoVisibility();
		});

		document.getElementById('toggle-activity-key').addEventListener('click', function (event) {
			event.preventDefault();
			toggleActivityKeyVisibility();
		});

		// Initialize the page (assuming this function exists elsewhere)
		initializePage();
	});


	function initializeColourKey() {
		let colourkeyHtml = '<div id="colour-key" style="display: flex; justify-content: space-around; padding: 10px 0;">';
		colourkeyHtml += "Activity type key: <br />";
		for (let type in activityColours) {
			let activitiesList = specificActivities[type].join(', ');
			colourkeyHtml += `
				<div style="flex: 1; text-align: center;" title="${activitiesList}">
					<span style="display: inline-block; width: 20px; height: 20px; background-color: ${activityColours[type]}; margin-right: 5px;"></span>
					<span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
				</div>
			`;
		}
		colourkeyHtml += '</div>';
	
		$('#colour-key-content').html(colourkeyHtml); // Insert into the collapsible section
	}
	
	function initializePage() {
		// Step 1: Attach event listeners
		addEventListeners();

		// Step 2: Render units from course data
		renderUnits();

		// Step 3: Load saved course data from local storage (if any)
		loadCourseFromLocalStorage();

		// Step 4: Update the course header (course name, learning outcomes, etc.)
		updateCourseHeader();

		// Step 5: Render the activity type pie chart
		renderPieChart();
	}


	//calculate unit duration	
	function calculateUnitDuration(unit) {
		let totalMinutes = 0;

		// Loop through each activity and calculate its duration
		unit.activities.forEach(activity => {
			if (activity.duration && activity.duration !== "N/A") {
				let [hours, minutes] = activity.duration.split(":").map(Number);
				totalMinutes += (hours * 60) + minutes; // Convert hours to minutes and add to the total
			}
		});

		// Convert the total minutes back to hours and minutes
		let hours = Math.floor(totalMinutes / 60);
		let minutes = totalMinutes % 60;
		return `${hours}h ${minutes}m`;
	}

// 	function ensureColourKeyContainerExists() {
// 		if ($('#colour-key-container').length === 0) {
// 			$('#toolbar').after('<div id="colour-key-container"></div>');
// 		}
// 	}


	// -------------------- END UTILITY FUNCTIONS --------------------

    initializeQuillEditors(); // Initialize rich text editors
    loadCourseFromLocalStorage(); // Load existing course data from localStorage
    renderUnits(); // Render the course units and activities
    
    // Initialize other components (sortable, listeners, etc.)
 //  	ensureColourKeyContainerExists();
//   	initializeColourKey();
    initializePage();
    initializeCollapsibleSections();
    initializeUnitSortable();
    initializeActivitySortable();
    addActivityCardListeners();
    addUnitPanelListeners();
});

// -------------------- END MAIN INITIALIZATION --------------------

