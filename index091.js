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
					<div class="unit-header">
						<div class="unit-title">${unit.title}</div>
						<button class="edit-unit">Edit</button>
						<button class="delete-unit">Delete</button>
					</div>
					<div class="activities-container"></div>
				</div>
			`);
			unit.activities.forEach((activity, activityIndex) => {
				let activityCardHtml = renderActivityCard(activity, activityIndex, unitIndex);
				unitPanel.find('.activities-container').append(activityCardHtml);
			});
			$('#course-container').append(unitPanel);
		});

		initializeActivitySortable(); // Reinitialize sorting for activities
		addActivityCardListeners(); // Add listeners to activity buttons
	}

	// Render a single activity card
	function renderActivityCard(activity, activityIndex, unitIndex) {
		return `
			<div class="activity-card" data-index="${activityIndex}" style="background-color: ${activityColours[activity.type]}">
				<h4>${activity.title}</h4>
				<p>${truncateText(activity.description, 10)}</p>
				<button class="edit-activity">Edit</button>
				<button class="delete-activity">Delete</button>
			</div>
		`;
	}

	// -------------------- END RENDER FUNCTIONS --------------------


	// -------------------- CRUD OPERATIONS --------------------

	// -------------- ACTIVITIES --------------

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

	// -------------- UNITS --------------

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

	// -------------------- END CRUD OPERATIONS --------------------


	// -------------------- SAVE AND LOAD OPERATIONS --------------------

	// -------------------- Save and Load Course Data --------------------

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

	// -------------------- END UTILITY FUNCTIONS --------------------

    initializeQuillEditors(); // Initialize rich text editors
    loadCourseFromLocalStorage(); // Load existing course data from localStorage
    renderUnits(); // Render the course units and activities

    // Initialize other components (sortable, listeners, etc.)
    initializeUnitSortable();
    initializeActivitySortable();
    addActivityCardListeners();
    addUnitPanelListeners();
});

// -------------------- END MAIN INITIALIZATION --------------------

