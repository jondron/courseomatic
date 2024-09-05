/*
	Author: Jon Dron (with help from chatGPT)
	Licence: CC-BY-NC-SA 4.0
	Date: 2024-09-02
	Version: 0.9beta
*/

$(document).ready(function () {
    let courseData = {
        name: "",
        creditHours: 1,
        goal: "",
        description: "",
        learningOutcomes: [],
        units: []
    };

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


//Initialize functions

//display the colour key

    function initializeColourKey() {
        let colourkeyHtml = '<div id="colour-key"  style="display: flex; justify-content: space-around; padding: 10px 0; background-color: #f5f5f5; margin-bottom: 10px;">';
        colourkeyHtml += "<br />Activity type key: <br />";
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

    // Initialize Quill editors
    let quillEditors = {};

    function initializeQuillEditor(selector) {
        let editor = new Quill(selector, {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    ['link', 'blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['clean']
                ]
            }
        });
        return editor;
    }

    // Initialize Quill editors for course, unit, and activity descriptions
    function initializeQuillEditors() {
        $('.quill-editor').each(function () {
            let editorId = $(this).attr('id');
            quillEditors[editorId] = initializeQuillEditor('#' + editorId);
        });
    }


// MENU LISTENERS
    $('#edit-course-info').on('click', function () {
        showCourseInfoPopup();
    });

    $('#create-new-unit').on('click', function () {
        showNewUnitPopup();
    });

    $('#learning-activity-menu').on('change', function () {
        let activityType = $(this).val();
        if (activityType) {
            showNewLearningActivityPopup(activityType);
        }
        $(this).val('');
    });

    $('#save-load-menu').on('click', function () {
        showSaveLoadPopup();
    });

    $('#clear-course-data').on('click', function () {
        if (confirm('Are you sure you want to clear all course data?')) {
            courseData = {
                name: "",
                creditHours: 1,
                goal: "",
                description: "",
                learningOutcomes: [],
                units: []
            };
            updateCourseHeader();
            renderPieChart();
            renderUnits();
            saveCourseToLocalStorage();
        }
    });

        // Update course name and outcomes when editing course info
    $('#save-course-info').on('click', function () {
        courseData.name = $('#course-name').val();
        courseData.creditHours = parseInt($('#course-credit-hours').val());
        courseData.goal = $('#course-goal').val();
        courseData.description = $('#course-description').val();
        saveLearningOutcomes();
        updateCourseHeader(); // Update the header display after saving
        renderPieChart();
        closePopup();
    });

    // Event listener for saving course to HTML
	$(document).on('click', '#save-html', function () {
		// console.log('Save to HTML button clicked'); // Logging for debugging
		saveCourseToHTML(); // The function to save the course as HTML
	})


//handle buttons on activity cards
    function addActivityCardListeners() {

		// get the right card for editing
        $('.edit-activity').off('click').on('click', function () {
            let activityCard = $(this).closest('.activity-card');
            let unitPanel = activityCard.closest('.unit-panel');
            let unitIndex = unitPanel.data('index');
            let activityId = activityCard.data('activity-id');
            let activityIndex = activityCard.index();
            editActivity(unitIndex, activityIndex);
        });


		// Attach the clone event listener using event delegation
		$('.activities-container').off('click', '.clone-activity').on('click', '.clone-activity', function () {
			let activityCard = $(this).closest('.activity-card');
			let unitPanel = activityCard.closest('.unit-panel');
			let unitIndex = unitPanel.data('index');
			let activityIndex = activityCard.index(); // Assuming the index in DOM matches the array index

			cloneActivity(unitIndex, activityIndex);
		});


		// Delete button listener
		$('.activities-container').off('click', '.delete-activity').on('click', '.delete-activity', function () {
			let activityCard = $(this).closest('.activity-card');
			let unitPanel = activityCard.closest('.unit-panel');
			let unitIndex = unitPanel.data('index');
			let activityIndex = activityCard.data('index');

			if (confirm('Are you sure you want to delete this activity?')) {
				deleteActivity(unitIndex, activityIndex);
				renderUnits();
				saveCourseToLocalStorage(); // Save changes to local storage
				calculateDurations(); // Update durations after deleting the activity
			}
		});

			 // Move left button listener
		$('.move-left').off('click').on('click', function (e) {
			e.stopPropagation();
			let activityCard = $(this).closest('.activity-card');
			moveActivityCardWithButton(activityCard, 'left');
		});

		// Move right button listener
		$('.move-right').off('click').on('click', function (e) {
			e.stopPropagation();
			let activityCard = $(this).closest('.activity-card');
			moveActivityCardWithButton(activityCard, 'right');
		});
    }

//handle buttons on unit panels
    function addUnitPanelListeners() {
        $('.edit-unit').off('click').on('click', function () {
            let unitIndex = $(this).closest('.unit-panel').data('index');
            editUnit(unitIndex);
        });

        $('.delete-unit').off('click').on('click', function () {
				let unitIndex = $(this).closest('.unit-panel').data('index');
				// Show a confirmation dialog
				if (confirm('Are you sure you want to delete this unit? This will also delete all its activities.')) {
					// If the user confirms, proceed with deletion
					courseData.units.splice(unitIndex, 1);
					renderUnits();
					saveCourseToLocalStorage(); // Save changes to local storage
					addActivityCardListeners(); // Add event listeners for activity cards
					addUnitPanelListeners(); // Add event listeners for unit buttons
					calculateDurations(); // Recalculate durations after deletion
				} else {
					// If the user cancels, do nothing
					console.log('Unit deletion canceled.');
				}
			});
	    }


// EDIT UNIT

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

		// Initialize the Quill editor with the existing unit description
		var quill = new Quill('#edit-unit-description-editor', {
			theme: 'snow' // You can choose 'bubble' or 'snow'
		});

		// Set the existing description content into the Quill editor
		quill.root.innerHTML = unit.description;

		// Event listener for saving the edited unit
		$('#save-unit').on('click', function () {
			unit.title = $('#edit-unit-title').val();
			unit.description = quill.root.innerHTML; // Get the HTML content from Quill
		    saveCourseToLocalStorage(); // Save changes to local storage
			renderUnits();
			initializeActivitySortable(); // Re-initialize sortable after editing
			addActivityCardListeners(); // Add event listeners for activity cards
			calculateDurations(); // Recalculate durations after editing
			closePopup();
		});

		// Event listener to close popup
		$('.close-popup').on('click', function () {
			closePopup();
		});
	}


//NEW UNIT

	function showNewUnitPopup() {
		$('#popup').html(`
			<div style="padding: 20px;">
				<label>Unit Title: <input type="text" id="unit-title" style="width: 90%;"></label><br><br>
				<label>Unit Description:</label>
				<div id="unit-description-editor" style="height: 150px;"></div><br><br>
				<button id="create-unit">Create Unit</button>
				<button class="close-popup">Cancel</button>
			</div>
		`).addClass('active');

		// Initialize the Quill editor for unit description
		var quill = new Quill('#unit-description-editor', {
			theme: 'snow' // You can choose 'bubble' or 'snow'
		});

		// Event listener for creating a new unit
		$('#create-unit').on('click', function () {
			let unitTitle = $('#unit-title').val();
			let unitDescription = quill.root.innerHTML; // Get the HTML content from Quill

			if (unitTitle) {
				createNewUnit(unitTitle, unitDescription);
				closePopup();
			}
		});

		// Event listener to close popup
		$('.close-popup').on('click', function () {
			closePopup();
		});
	}

	 function createNewUnit(title, description) {
		let newUnit = {
			title: title,
			description: description, // This will contain the HTML content from Quill
			activities: []
		};
		courseData.units.push(newUnit);
		renderUnits();
		initializeActivitySortable(); // Re-initialize sortable after adding new elements
		addActivityCardListeners(); // Add event listeners for activity cards
		calculateDurations(); // Calculate durations after adding a new unit
	}


// EDIT COURSE INFO

    function showCourseInfoPopup() {
        $('#popup').html(`
          <div style="padding: 20px;">
                <label>Course Name: <input type="text" id="course-name" style="width: 90%;"></label><br><br>
                <label>Credit Hours: <input type="number" id="course-credit-hours" min="1" max="15" value="1"></label><br><br>
                <label>Course Goal: <textarea id="course-goal" style="width: 90%; height: 60px;"></textarea></label><br><br>
                <label>Course Description:</label>
                <div id="course-description-editor" class="quill-editor" style="height: 100px;"></div><br>
                <label>Learning Outcomes:</label><br>
                <div id="learning-outcomes-container" style="max-height: 150px; overflow-y: auto; width: 90%;"></div><br>
                <button id="add-learning-outcome">Add Learning Outcome</button><br><br>
                <button id="save-course-info">Save</button>
                <button class="close-popup">Cancel</button>
            </div>
        `).addClass('active');

        $('#course-name').val(courseData.name);
        $('#course-credit-hours').val(courseData.creditHours);
        $('#course-goal').val(courseData.goal);
        $('#course-description').val(courseData.description);

        initializeQuillEditors();
        quillEditors['course-description-editor'].root.innerHTML = courseData.description;


        updateLearningOutcomesUI();

        $('#add-learning-outcome').on('click', function () {
            courseData.learningOutcomes.push('');
            updateLearningOutcomesUI();
        });

        $('#save-course-info').on('click', function () {
            courseData.name = $('#course-name').val();
            courseData.creditHours = parseInt($('#course-credit-hours').val());
            courseData.goal = $('#course-goal').val();
   		    courseData.description = quillEditors['course-description-editor'].root.innerHTML; // Save Quill content
            saveLearningOutcomes();
            saveCourseToLocalStorage(); // Save changes to local storage
            closePopup();
            updateCourseHeader();
            renderPieChart();
        });

        $('.close-popup').on('click', function () {
            closePopup();
        });
    }

//DISPLAY COURSE INFO

    function updateCourseHeader() {
		// Get the course name and learning outcomes from courseData
		const courseName = courseData.name || "Untitled Course";
		const courseGoal = courseData.goal || "";
		const courseDescription = courseData.description || "";
		const courseCreditHours = courseData.creditHours || "";
		const learningOutcomes = courseData.learningOutcomes || [];
		// Calculate total duration of the course
	    let totalCourseMinutes = 0; // Initialize total minutes counter
		courseData.units.forEach(unit => {
			unit.activities.forEach(activity => {
				if (activity.duration && activity.duration !== "N/A") {
					let [hours, minutes] = activity.duration.split(":").map(Number);
					totalCourseMinutes += (hours * 60) + minutes;
				}
			});
		});

		// Convert total minutes to hours and minutes
		let totalCourseHours = Math.floor(totalCourseMinutes / 60);
		let remainingMinutes = totalCourseMinutes % 60;
		let totalDurationText = `${totalCourseHours}h ${remainingMinutes}m`;

		/*// get assessed learning outcomes
		let assessedOutcomes = getUnassessedLearningOutcomes(false);
		if (assessedOutcomes){
			// Display unassessed learning outcomes
			outcomesListHtml = '<ul>';
			assessedOutcomes.forEach(outcome => {
				outcomesListHtml += `<li>${outcome}</li>`;
			});
			outcomesListHtml += '</ul>';
		} */

		// Get unassessed learning outcomes
		let unassessedOutcomes = getUnassessedLearningOutcomes();
		if (unassessedOutcomes){
			// Display unassessed learning outcomes
			outcomesListHtml = '<ul>';
			unassessedOutcomes.forEach(outcome => {
				outcomesListHtml += `<li>${outcome}</li>`;
			});
			outcomesListHtml += '</ul>';
		} else {
			outcomesListHtml = 'none';
		}

		// Create a numbered list of learning outcomes
		let outcomesHtml = '<ol id="learning-outcomes-list">';
		learningOutcomes.forEach(outcome => {
			outcomesHtml += `<li>${outcome}</li>`;
		});
		outcomesHtml += '</ol>';



		// add info on specific activities
		let specificActivityDetails = "";
		courseData.units.forEach((unit, unitIndex) => {
			specificActivityDetails += `<strong>Specific Activities:</strong>`;
			specificActivityDetails += `<strong>${unit.title}: </strong><ul class="assess-list">`;
			unit.activities.forEach(activity => {
				specificActivityDetails += `<li>${activity.type} - ${activity.specificType || 'N/A'}</li>`;
			});
        specificActivityDetails += `</ul>`;
	    });

		//now count them

		// Create an object to store counts of each specific activity type
		const activityTypeCounts = {};

		// Loop through each unit and activity to count specific activity types
		courseData.units.forEach(unit => {
			unit.activities.forEach(activity => {
				const type = activity.specificType;
				if (activityTypeCounts[type]) {
					activityTypeCounts[type]++;
				} else {
					activityTypeCounts[type] = 1;
				}
			});
		});

		// Create a summary list of specific activity types and their counts
		let activityTypeSummaryHtml = '<ul>';
		for (const [type, count] of Object.entries(activityTypeCounts)) {
			activityTypeSummaryHtml += `<li>${type}: ${count}</li>`;
		}
		activityTypeSummaryHtml += '</ul>';


		// note: any divs will get shrunk. Use other elements to make details persist when shrunk
		const courseDetails=`
			<h3 class="shrink-children">${courseName} <span style = "font-size:small">(click to expand/shrink course information)</span></h3>
			<div id="basic-info">
				<div id="details">
					<p><strong>Credits:</strong> ${courseCreditHours} </p>
					<p><strong>Goal:</strong> ${courseGoal}</p>
					<p><strong>Description:</strong> ${courseDescription} </p>
				</div>
				<p id='learning-outcomes-display'><strong>Course learning outcomes: </strong> ${outcomesHtml}</div>
			</div>
			<p id='total-course-duration'>
					<strong>Total Course Study Hours:</strong> ${totalDurationText}
			</p>
				<span id="pie-chart">
						<canvas id="activityPieChart" width="250" height="250"></canvas>
				</span>

			<div id='useful-stats'>
				<h3> Content info: </h3>
				<div>
					<strong>Learning outcomes not yet assessed:</strong><br />
					${outcomesListHtml}

				</div>
				<div id= 'assessed-activities'>
					<strong>Assessed Activities:</strong>
					<ol class="assess-list">
						${getAssessedActivitiesTitles().map(title => `<li class="assess-list">${title}</li>`).join('')}
					</ol>
				</div>
				<div id="specific-activities">
					<p><strong>Specific activities used (summary):</strong> </>
					${activityTypeSummaryHtml}
					<p><strong>Specific activities per unit:</strong> </>>
					${specificActivityDetails}
				</div>

			</div>
		`;

	// 			<div id="chart-container">
// 					<strong>Relative time spent per activity type:</strong><br />
// 					<div id="pie-chart">
// 						<canvas id="activityPieChart" width="250" height="250"></canvas>
// 					</div>
// 				</div>
//
// 		// Update the course name display
		// $('#course-name-display').text(courseName);
		$('#course-details-display').html(courseDetails);

// 		// Add click event listener to all elements with class 'shrink-children'
// 		// this is used to make the course info compact
// 		document.querySelectorAll('.shrink-children').forEach(header => {
// 			header.addEventListener('click', function(event) {
// 		        event.stopPropagation(); // Stop the event from propagating to parent elements
// 				// Get the parent div of the clicked header
// 				const parentDiv = this.parentElement;
// 				console.log("this was called: "+this.parentElement.id);
// 				// Toggle the visibility of all child divs of the parent div
// 				Array.from(parentDiv.children).forEach(child => {
// 					if (child !== this && child.tagName.toLowerCase() === 'div') {
// 						// Toggle display between none and block
// 						child.style.display = (child.style.display === 'block' || child.style.display === '') ? 'none' : 'block';
// 						console.log("child: "+child.id);
// 					}
// 				});
// 			});
// 		});
	}

	// Add click event listener to all elements with class 'shrink-children'
	// this is used to make the course info compact
	// Attach the event listener to the document or a common container
	document.addEventListener('click', function(event) {
		// Check if the clicked element has the class 'shrink-children'
		if (event.target.classList.contains('shrink-children')) {
			event.stopPropagation(); // Prevent the event from bubbling further

			// Get the parent div of the clicked header
			const parentDiv = event.target.parentElement;

			// Toggle the visibility of all child divs of the parent div
			Array.from(parentDiv.children).forEach(child => {
				if (child !== event.target && child.tagName.toLowerCase() === 'div') {
					// Toggle display between none and block
					child.style.display = (child.style.display === 'block' || child.style.display === '') ? 'none' : 'block';
				}
			});
		}
	});

//EDIT ACTIVITY

    function editActivity(unitIndex, activityIndex) {
     const activity = courseData.units[unitIndex].activities[activityIndex];
		// const activity = findActivityById(unitIndex, activityIndex);
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

        // Initialize Quill for the activity description
        initializeQuillEditors();
        quillEditors['edit-activity-description-editor'].root.innerHTML = activity.description;
	  // Show additional fields when "Assessed" is checked
		$('#edit-activity-assessed').on('change', function () {
			if ($(this).is(':checked')) {
				$('#edit-assessment-details').show();
			} else {
				$('#edit-assessment-details').hide();
			}
		});
        $('#save-activity').on('click', function () {
            activity.title = $('#edit-activity-title').val();
    	    activity.description = quillEditors['edit-activity-description-editor'].root.innerHTML; // Save Quill content
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
            renderUnits();
            closePopup();
        });

        $('.close-popup').on('click', function () {
            closePopup();
        });
    }


// NEW ACTIVITY

	function showNewLearningActivityPopup(type) {
		if (!checkUnitsExist()) {
			alert("You must create at least one unit before you can add an activity. Sorry for the inconvenience. I'll open the 'create unit' form for you.");
			showNewUnitPopup();
			return; // Check for unit existence before proceeding
		}
		$('#popup').html(`
			<div style="padding: 20px;">
				<label>Activity Title: <input type="text" id="activity-title" style="width: 90%;"></label><br><br>
				<label>Activity Description:</label>
				<div id="activity-description-editor" style="height: 100px; background: #fff;"></div><br><br>
				<label>Specific Activity:
					<select id="specific-activity" style="width: 92%;">
						${specificActivities[type].map(activity => `<option value="${activity}">${activity}</option>`).join('')}
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
					specificActivities[type].push(newActivity);
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
				createNewActivity(type, activityTitle, activityDescription, activityDuration, activityAssessed, specificType, selectedOutcomes, unitIndex, required, passMark, weighting, markingHours);
				closePopup();
			}
		});

		// Event listener to close popup
		$('.close-popup').on('click', function () {
			closePopup();
		});
	}



	function createNewActivity(type, title, description, duration, assessed, specificType, outcomes, unitIndex, required = false, passMark = null, weighting = null, markingHours = null) {
		let newActivity = {
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

		if (courseData.units[unitIndex]) { // Safeguard to avoid undefined references
			courseData.units[unitIndex].activities.push(newActivity);
	        reindexActivities(unitIndex); // Reindex after adding new activity
		}

		renderUnits(); // Re-render the UI
		saveCourseToLocalStorage(); // Ensure data is saved to local storage
		initializeActivitySortable(); // Re-initialize sortable to update UI
		addActivityCardListeners(); // Add event listeners for new activity cards
		calculateDurations(); // Calculate durations after creating an activity
	}

// SHOW SAVE/LOAD OPTIONS

    function showSaveLoadPopup() {
        $('#popup').html(`
            <div style="padding: 20px;">
                <button id="save-course">Save Course</button>
                <button id="load-course">Load Course</button>
                <input type="file" id="load-course-file" style="display: none;">
                <button id="export-pdf">Export to PDF</button>
                <button id="copy-clipboard">Copy to Clipboard</button>
                <button id="save-html">Save to HTML</button>
                <button class="close-popup">Cancel</button>
            </div>
        `).addClass('active');

        $('#save-course').on('click', function () {
            let dataStr = JSON.stringify(courseData);
            let blob = new Blob([dataStr], { type: "application/json" });
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = `${courseData.name.replace(/\s+/g, '_')}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        $('#load-course').on('click', function () {
            $('#load-course-file').click();
        });

        $('#load-course-file').on('change', function (event) {
            let file = event.target.files[0];
            if (file) {
                let reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        courseData = JSON.parse(e.target.result);
                        updateCourseHeader();
        				renderPieChart();
                        renderUnits();
                        saveCourseToLocalStorage();
                        closePopup();
                    } catch (err) {
                        alert('Failed to load course data: Invalid JSON format.');
                    }
                };
                reader.readAsText(file);
            }
        });

        $('#export-pdf').on('click', function () {
            exportToPDF();
        });

        $('#copy-clipboard').on('click', function () {
            copyToClipboard();
        });

        $('.close-popup').on('click', function () {
            closePopup();
        });
    }


 //SHOW ACTIVITY CHART

	let activityChartInstance; // Variable to hold the chart instance

	// Function to display a pie chart of activity types
	function displayActivityTypePieChart(variation = 'ordinal') {


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

				activityCounts[type] = (activityCounts[type] || 0) + 1;
				activityDurations[type] = (activityDurations[type] || 0) + duration;
			});
		});
		// Prepare data for the chart
		let labels = [];
		let data = [];
		let backgroundColor = [];

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

		// Create a pie chart
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
							label: function(context) {
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



// MAKE AN SVG FOR THE HTML REPORT - 2 functions, to prepare and to draw
	function preparePieChartData(chartType) {
		const activityCounts = {};
		const activityDurations = {};

		// Initialize the activity counts and durations
		for (const type in activityColours) {
			activityCounts[type] = 0;
			activityDurations[type] = 0;
		}

		// Count the number of activities or calculate total durations
		courseData.units.forEach(unit => {
			unit.activities.forEach(activity => {
				if (activityCounts[activity.type] !== undefined) {
					activityCounts[activity.type]++;
					const [hours, minutes] = activity.duration.split(":").map(Number);
					const durationInMinutes = hours * 60 + minutes;
					activityDurations[activity.type] += durationInMinutes;
				}
			});
		});

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



	function generatePieChartSVG(data, chartType) {
		const diameter = 400; // Diameter of the SVG pie chart
		const radius = diameter / 2;
		const padding = 10; // Padding to ensure the chart isn't cut off

		const colour = d3.scaleOrdinal()
			.domain(data.map(d => d.type))
			.range(data.map(d => activityColours[d.type]));

		const pie = d3.pie()
			.value(d => d.value);

		const arc = d3.arc()
			.outerRadius(radius - padding)
			.innerRadius(0);

		const pieData = pie(data);

    // Create an SVG element with a flexible size
		const svg = d3.create("svg")
			.attr("viewBox", `0 0 ${diameter + padding * 2} ${diameter + padding * 2}`)
			.attr("width", diameter + padding * 2)
			.attr("height", diameter + padding * 2)
			.attr("preserveAspectRatio", "xMidYMid meet")
			.attr("xmlns", "http://www.w3.org/2000/svg")
			.append("g")
			.attr("transform", `translate(${radius + padding},${radius + padding})`);

	const arcs = svg.selectAll("arc")
			.data(pieData)
			.enter()
			.append("g")
			.attr("class", "arc");

		arcs.append("path")
			.attr("d", arc)
			.attr("fill", d => colour(d.data.type));

		// Return the entire SVG element as a string
		return svg.node().outerHTML;
	}

	// Helper function to parse duration to minutes
	function parseDurationToMinutes(duration) {
		const [hours, minutes] = duration.split(':').map(Number);
		return (hours * 60) + minutes;
	}

// MAKE A TEXT REPORT FOR THE CLIPBOARD

	function copyToClipboard() {
		let text = `Course Name: ${courseData.name}\n`;
		text += `Credit Hours: ${courseData.creditHours}\n`;
		text += `Course Goal: ${courseData.goal}\n`;
		text += `Course Description: ${courseData.description}\n`;
		text += `Learning Outcomes:\n`;
		text += courseData.learningOutcomes.map((outcome, index) => `${index + 1}. ${outcome}`).join('\n');
		text += `\n\nUnits:\n`;

		let totalMarkingHours = 0;
		let assessedElements = [];
		let unassessedOutcomes = new Set(courseData.learningOutcomes);

		courseData.units.forEach((unit, unitIndex) => {
			text += `Unit ${unitIndex + 1}: ${unit.title}\n`;
			text += `Description: ${unit.description}\n`;
			text += `Total Duration: ${calculateUnitDuration(unit)}\n`;
			text += `Learning Outcomes: ${getUnitLearningOutcomes(unit)}\n`;

			unit.activities.forEach(activity => {
				text += `- ${activity.title}: ${activity.specificType}\n`;
				text += `  Duration: ${activity.duration || "N/A"}\n`;
				text += `  Assessed: ${activity.assessed ? 'Yes' : 'No'}\n`;

				if (activity.assessed) {
					totalMarkingHours += parseFloat(activity.markingHours) || 0;

					assessedElements.push({
						title: activity.title,
						required: activity.required ? 'Yes' : 'No',
						passMark: activity.passMark || 'N/A',
						weighting: activity.weighting || 'N/A',
					});

					activity.outcomes.forEach(outcomeIndex => {
						unassessedOutcomes.delete(courseData.learningOutcomes[outcomeIndex]);
					});

					text += `  Required: ${activity.required ? 'Yes' : 'No'}\n`;
					text += `  Pass Mark: ${activity.passMark || 'N/A'}\n`;
					text += `  Weighting: ${activity.weighting || 'N/A'}\n`;
					text += `  Marking Hours: ${activity.markingHours || 'N/A'}\n`;
				}

				text += '\n';
			});

			text += '\n';
		});

		// Summary Section
		text += "Assessment Summary\n";
		text += `Total Marking Hours: ${totalMarkingHours}\n`;
		text += "Assessed Elements:\n";
		assessedElements.forEach(element => {
			text += `${element.title}\n`;
			text += `  Required: ${element.required}\n`;
			text += `  Pass Mark: ${element.passMark}\n`;
			text += `  Weighting: ${element.weighting}\n`;
			text += '\n';
		});

		text += "Unassessed Outcomes:\n";
		if (unassessedOutcomes.size > 0) {
			Array.from(unassessedOutcomes).forEach(outcome => {
				text += `${outcome}\n`;
			});
		} else {
			text += "All outcomes assessed\n";
		}

		navigator.clipboard.writeText(text).then(function () {
			alert('Course details copied to clipboard!');
		}, function (err) {
			alert('Failed to copy: ', err);
		});
	}

//MAKE A PDF REPORT

   function saveCourseToPDF() {
		const { jsPDF } = window.jspdf;
		const doc = new jsPDF();

		doc.setFontSize(12);
		doc.text(`Course Name: ${courseData.name}`, 10, 10);
		doc.text(`Credit Hours: ${courseData.creditHours}`, 10, 20);
		doc.text(`Course Goal: ${courseData.goal}`, 10, 30);
		doc.text(`Course Description: ${courseData.description}`, 10, 40);
		doc.text("Learning Outcomes:", 10, 50);

		let y = 60;
		courseData.learningOutcomes.forEach((outcome, index) => {
			doc.text(`${index + 1}. ${outcome}`, 10, y);
			y += 10;
		});

		doc.text("Units:", 10, y);
		y += 10;

		let totalMarkingHours = 0;
		let assessedElements = [];
		let unassessedOutcomes = new Set(courseData.learningOutcomes);

		courseData.units.forEach((unit, unitIndex) => {
			doc.text(`Unit ${unitIndex + 1}: ${unit.title}`, 10, y);
			y += 10;
			doc.text(`Description: ${unit.description}`, 10, y);
			y += 10;
			doc.text(`Total Duration: ${calculateUnitDuration(unit)}`, 10, y);
			y += 10;
			doc.text(`Learning Outcomes: ${getUnitLearningOutcomes(unit)}`, 10, y);
			y += 10;

			unit.activities.forEach(activity => {
				doc.text(`- ${activity.title}: ${activity.specificType}`, 10, y);
				y += 10;
				doc.text(`  Duration: ${activity.duration || "N/A"}`, 10, y);
				y += 10;
				doc.text(`  Assessed: ${activity.assessed ? 'Yes' : 'No'}`, 10, y);
				y += 10;

				if (activity.assessed) {
					totalMarkingHours += parseFloat(activity.markingHours) || 0;

					assessedElements.push({
						title: activity.title,
						required: activity.required ? 'Yes' : 'No',
						passMark: activity.passMark || 'N/A',
						weighting: activity.weighting || 'N/A',
					});

					activity.outcomes.forEach(outcomeIndex => {
						unassessedOutcomes.delete(courseData.learningOutcomes[outcomeIndex]);
					});

					doc.text(`  Required: ${activity.required ? 'Yes' : 'No'}`, 10, y);
					y += 10;
					doc.text(`  Pass Mark: ${activity.passMark || 'N/A'}`, 10, y);
					y += 10;
					doc.text(`  Weighting: ${activity.weighting || 'N/A'}`, 10, y);
					y += 10;
					doc.text(`  Marking Hours: ${activity.markingHours || 'N/A'}`, 10, y);
					y += 10;
				}

				if (y > 280) {
					doc.addPage();
					y = 10;
				}
			});

			y += 10;
		});

		// Summary Section
		doc.text("Assessment Summary", 10, y);
		y += 10;
		doc.text(`Total Marking Hours: ${totalMarkingHours}`, 10, y);
		y += 10;
		doc.text("Assessed Elements:", 10, y);
		y += 10;
		assessedElements.forEach(element => {
			doc.text(`${element.title}`, 10, y);
			y += 10;
			doc.text(`  Required: ${element.required}`, 10, y);
			y += 10;
			doc.text(`  Pass Mark: ${element.passMark}`, 10, y);
			y += 10;
			doc.text(`  Weighting: ${element.weighting}`, 10, y);
			y += 10;

			if (y > 280) {
				doc.addPage();
				y = 10;
			}
		});

		doc.text("Unassessed Outcomes:", 10, y);
		y += 10;
		if (unassessedOutcomes.size > 0) {
			Array.from(unassessedOutcomes).forEach(outcome => {
				doc.text(outcome, 10, y);
				y += 10;
				if (y > 280) {
					doc.addPage();
					y = 10;
				}
			});
		} else {
			doc.text("All outcomes assessed", 10, y);
		}

		doc.save('CourseDetails.pdf');
	}


// MAKE AN HTML REPORT


	function saveCourseToHTML() {
		let htmlContent = `<!DOCTYPE html>
			<html lang="en">
			<head>
			   <title>Course-omatic output for ${courseData.name}</title>
			 </head>
			<body>

			<h1>${courseData.name}</h1>
			<p><strong>Credit Hours:</strong> ${courseData.creditHours}</p>
			<p><strong>Course Goal:</strong> ${courseData.goal}</p>
			<p><strong>Description:</strong> ${courseData.description}</p>
			<h2>Learning Outcomes</h2>
			<ol>
				${courseData.learningOutcomes.map((outcome, index) => `<li>${outcome}</li>`).join('')}
			</ol>
			<div id="colour-key" style="display: flex; justify-content: space-around; padding: 10px 0; background-color: #f0f0f0; margin-bottom: 10px;">
			</div>
			<h2>Units</h2>
		`;

		let totalMarkingHours = 0;
		let assessedElements = [];
		let unassessedOutcomes = new Set(courseData.learningOutcomes);

		courseData.units.forEach((unit, unitIndex) => {
			let unitHtml = `
				<h3>Unit ${unitIndex + 1}: ${unit.title}</h3>
				<p>${unit.description}</p>
				<p><strong>Total Duration:</strong> ${calculateUnitDuration(unit)}</p>
				<p><strong>Learning Outcomes:</strong> ${getUnitLearningOutcomes(unit)}</p>
				<ul>
			`;

			unit.activities.forEach((activity) => {
				unitHtml += `
					<li style="background-color: ${activityColours[activity.type]}; padding: 10px; margin-bottom: 10px;">
						<h4>${activity.title}</h4>
						<p>${activity.description}</p>
						<p><strong>Type:</strong> ${activity.specificType}</p>
						<p><strong>Duration:</strong> ${activity.duration || "N/A"}</p>
						<p><strong>Assessed:</strong> ${activity.assessed ? 'Yes' : 'No'}</p>
				`;

				if (activity.assessed) {
					totalMarkingHours += parseFloat(activity.markingHours) || 0;

					assessedElements.push({
						title: activity.title,
						required: activity.required ? 'Yes' : 'No',
						passMark: activity.passMark || 'N/A',
						weighting: activity.weighting || 'N/A',
					});

					// Remove assessed outcomes from the unassessed set
					activity.outcomes.forEach(outcomeIndex => {
						unassessedOutcomes.delete(courseData.learningOutcomes[outcomeIndex]);
					});

					unitHtml += `
						<p><strong>Required:</strong> ${activity.required ? 'Yes' : 'No'}</p>
						<p><strong>Pass Mark:</strong> ${activity.passMark || 'N/A'}</p>
						<p><strong>Weighting:</strong> ${activity.weighting || 'N/A'}</p>
						<p><strong>Marking Hours:</strong> ${activity.markingHours || 'N/A'}</p>
					`;
				}

				unitHtml += '</li>';
			});

			unitHtml += '</ul>';
			htmlContent += unitHtml;
		});

		// Summary Section
		htmlContent += `
			<h2>Assessment Summary</h2>
			<p><strong>Total Marking Hours:</strong> ${totalMarkingHours}</p>
			<h3>Assessed Elements</h3>
			<ul>
				${assessedElements.map(element => `
					<li>
						<strong>${element.title}</strong><br>
						Required: ${element.required}<br>
						Pass Mark: ${element.passMark}<br>
						Weighting: ${element.weighting}
					</li>
				`).join('')}
			</ul>

			<h3>Unassessed Outcomes</h3>
		`;

		if (unassessedOutcomes.size > 0) {
			htmlContent += `<ul>${Array.from(unassessedOutcomes).map(outcome => `<li>${outcome}</li>`).join('')}</ul>`;
		} else {
			htmlContent += '<p>All outcomes assessed</p>';
		}

		//add the pie chart

	    const proportionalData = preparePieChartData('proportional');
    	const proportionalSVG = "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>"+ generatePieChartSVG(proportionalData, 'proportional')+"</svg>";
    	const colourKey = initializeColourKey();
		htmlContent += `
						<p><strong>Relative time spent per activity type:</strong></p>
						`;
    	htmlContent += `
    					<div id="svg-container" style="width: 100%; max-width: 600px; height: auto; overflow: visible;">
    						${proportionalSVG}
    					</div>

    					`;
    	htmlContent += colourKey;


    	htmlContent += `
    					<div> End of report </div>

    					</body>
    					</html>
    	`;


		// Save the HTML content
		let blob = new Blob([htmlContent], { type: "text/html" });
		let url = URL.createObjectURL(blob);
		let a = document.createElement('a');
		a.href = url;
		a.download = "courseData.html";
		a.click();
		URL.revokeObjectURL(url);
	}

//utility functions

    function updateUnitOrder() {
        let newUnitOrder = [];
        $('.unit-panel').each(function () {
            let unitIndex = $(this).data('index');
            newUnitOrder.push(courseData.units[unitIndex]);
        });
        courseData.units = newUnitOrder;
        reindexUnits();
        saveCourseToLocalStorage();
    }

    function updateActivityOrder(movedActivityCard, oldUnitIndex, newUnitIndex, newIndex) {
        let activityId = movedActivityCard.data('activity-id');
        let movedActivity = findActivityById(oldUnitIndex, activityId);
        if (movedActivity) {
            courseData.units[oldUnitIndex].activities = courseData.units[oldUnitIndex].activities.filter(a => a.id !== activityId);
            courseData.units[newUnitIndex].activities.splice(newIndex, 0, movedActivity);
            updateCourseDataFromDOM();
            saveCourseToLocalStorage();
            calculateDurations();
            renderUnits();
        }
    }

 	// an attempt to fix failed update after moving
	function updateActivityOrderAfterMove() {
		courseData.units.forEach((unit, unitIndex) => {
			const updatedActivities = [];
			$(`.unit-panel[data-index=${unitIndex}] .activity-card`).each(function () {
				const activityId = $(this).data('activity-id');
				const activity = findActivityById(unitIndex, activityId);
				if (activity) {
					updatedActivities.push(activity);
				}
			});
			courseData.units[unitIndex].activities = updatedActivities;
		});
	}


    // Function to handle deleting an activity
    function deleteActivity(unitIndex, activityIndex) {
        if (confirm('Are you sure you want to delete this activity?')) {
            const unit = courseData.units[unitIndex];
        //    const activityIndex = unit.activities.findIndex(a => a.id === activityId);
		    const activity = courseData.units[unitIndex].activities[activityIndex];

            if (activityIndex > -1) {
                unit.activities.splice(activityIndex, 1);
                renderUnits();
                saveCourseToLocalStorage();
                initializeActivitySortable();
                addActivityCardListeners();
                calculateDurations();
            }
        }
    }


	// Function to clone an activity
	function cloneActivity(unitIndex, activityIndex) {
		// Check if the provided indices are valid
		//if (courseData.units[unitIndex] && courseData.units[unitIndex].activities[activityIndex]) {
 	    const activity = courseData.units[unitIndex].activities[activityIndex];
		if (activity){
			let activityToClone = courseData.units[unitIndex].activities[activityIndex];

			// Create a deep copy of the activity to clone
			let clonedActivity = JSON.parse(JSON.stringify(activityToClone));

			// Generate a new ID for the cloned activity
			clonedActivity.id = generateNewActivityId();

			// Insert the cloned activity after the original activity
			courseData.units[unitIndex].activities.splice(activityIndex + 1, 0, clonedActivity);

			// Re-render the units to reflect changes
			renderUnits();

			// Save changes to local storage
			saveCourseToLocalStorage();

			// Recalculate total durations
			calculateDurations();
		} else {
			console.error('Error: The selected activity could not be found.');
		}
	}

	// Utility function to generate a new unique ID for an activity
	function generateNewActivityId() {
		return 'activity-' + Math.random().toString(36).substr(2, 9);
	}

	// to track whether all outcomes are assessed
    function getUnassessedLearningOutcomes(yn) {
		// Create a set to keep track of assessed outcomes
		let assessedOutcomes = new Set();

		// Loop through each unit and its activities to collect assessed outcomes
		courseData.units.forEach(unit => {
			unit.activities.forEach(activity => {
				if (activity.assessed) {
					// Add each outcome of the assessed activity to the set
					activity.outcomes.forEach(outcomeIndex => {
						assessedOutcomes.add(outcomeIndex);
					});
				}
			});
		});

		//optionally return list of assessed outcomes
		if (yn){

			return assessedOutcomes;
		}
		// Create a list of unassessed outcomes by filtering course learning outcomes
		let unassessedOutcomes = courseData.learningOutcomes.filter((outcome, index) => !assessedOutcomes.has(index));

		return unassessedOutcomes;
	}


	// Function to get titles of assessed activities
	function getAssessedActivitiesTitles() {
		let assessedTitles = [];
		courseData.units.forEach(unit => {
			unit.activities.forEach(activity => {
				if (activity.assessed) {
					assessedTitles.push(activity.title);
				}
			});
		});
		return assessedTitles;
	}


    function findActivityById(unitIndex, activityId) {
        return courseData.units[unitIndex].activities.find(activity => activity.id === activityId);
    }

    function reindexUnits() {
        courseData.units.forEach((unit, index) => {
            unit.index = index;
            $(`.unit-panel[data-index='${index}']`).data('index', index);
        });
    }

	// Function to truncate text to a specified number of words
	function truncateText(text, wordLimit) {
		const words = text.split(' ');
		if (words.length > wordLimit) {
			return words.slice(0, wordLimit).join(' ') + '...';
		}
		return text;
	}

	// Function to update the data structure after moving an activity
	function moveActivity(oldUnitIndex, activityIndex, newUnitIndex, newPosition) {
		// Get the activity object
		const activity = courseData.units[oldUnitIndex].activities[activityIndex];

		// Remove it from the old unit
		courseData.units[oldUnitIndex].activities.splice(activityIndex, 1);

		// Add it to the new unit at the specified position
		courseData.units[newUnitIndex].activities.splice(newPosition, 0, activity);

		// Re-index activities in both units
		reindexActivities(oldUnitIndex);
		reindexActivities(newUnitIndex);

		// Re-render units to reflect changes
		renderUnits();
		saveCourseToLocalStorage();
	}


	// Function to re-index activities
	function reindexActivities(unitIndex) {
		courseData.units[unitIndex].activities.forEach((activity, activityIndex) => {
			activity.index = activityIndex; // Update index in the data model
			$(`.unit-panel[data-index='${unitIndex}'] .activity-card[data-activity-id='${activity.id}']`).data('index', activityIndex); // Update index in DOM
		});
	}


	function renderActivityCard(activity, activityIndex, unitIndex) {
		let color = activityColours[activity.type] || 'gray';
		const outcomeNumbers = activity.outcomes.map(i => i + 1).join('; '); // Use semicolon to separate
  		 const truncatedDescription = truncateText(activity.description, 10);

		// Check if the activity is assessed and display the additional fields if true
		let assessedInfo = activity.assessed ? `
			<div>Required: ${activity.required ? 'Yes' : 'No'}</div>
			<div>Pass Mark: ${activity.passMark || 'N/A'}%</div>
			<div>Weighting: ${activity.weighting || 'N/A'}%</div>
			<div>Marking Hours: ${activity.markingHours || 'N/A'}</div>
		` : '';

		return `
			<div class="activity-card" data-activity-id="${activity.id}" data-index="${activityIndex}" data-unit-index="${unitIndex}" style="background-color: ${color}; width: 275px; height: 270px; padding: 10px; position: relative;">
				<div style="font-weight: bold; margin-bottom: 5px;">${activity.title}</div>
		        <div class="description">${truncatedDescription}</div>
				<div>Type: ${activity.specificType || "N/A"}</div>
				<div>Duration: ${activity.duration || "N/A"}</div>
				<div>Assessed: ${activity.assessed ? 'Yes' : 'No'}</div>
				${assessedInfo}
				<div>Outcomes: ${outcomeNumbers}</div>
				${activity.assessed ? '<span class="star" style="position: absolute; top: 10px; right: 10px; color: red;" title="assessed">★</span>' : ''}
	            <div class="activity-buttons" style="position: absolute; bottom: 10px; right: 10px;">
                    <button class="move-left">←</button>
                    <button class="move-right">→</button>
					<button class="edit-activity" title="Edit">🖋️</button>
					<button class="clone-activity"  title="Clone">📋</button>
					<button class="delete-activity"  title="Delete">❌</button>
				</div>
			</div>
		`;
	}

	function calculateActivityDurationInMinutes(duration) {
		if (duration && duration !== "N/A") {
			let [hours, minutes] = duration.split(":").map(Number);
			return (hours * 60) + minutes;
		}
		return 0;
	}

	function renderPieChart(){

			// draw proportions of activity types

		// ordinalView = displayActivityTypePieChart('ordinal');
		displayActivityTypePieChart('proportional');

	}

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
                <div class="unit-duration">Total Duration: 0h 0m</div>
                <div class="unit-outcomes">Learning Outcomes: </div>
                <h3>Unit activities:</h3>
                <div class="activities-container" data-unit-index="${unitIndex}"></div>
            </div>
        `);

     // Calculate total duration for the unit
        let totalUnitMinutes = 0;

        unit.activities.forEach((activity, activityIndex) => {
            totalUnitMinutes += calculateActivityDurationInMinutes(activity.duration); // Helper function to calculate duration
            let activityCardHtml = renderActivityCard(activity, activityIndex, unitIndex);
            unitPanel.find('.activities-container').append(activityCardHtml);
        });
      // Display total unit duration
        unitPanel.find('.unit-duration').text(`Total Duration: ${Math.floor(totalUnitMinutes / 60)}h ${totalUnitMinutes % 60}m`);


        $('#course-container').append(unitPanel);
    });
		// Check if course information should be displayed or not
// 		if (isCourseInfoVisible) {
// 			document.getElementById('course-info').style.display = 'block';
// 		} else {
// 			document.getElementById('course-info').style.display = 'none';
// 		}
		initializeActivitySortable();
        addActivityCardListeners();
        calculateDurations();
        updateCourseHeader();
        renderPieChart();
        addUnitPanelListeners();
    }

    // Function to handle deleting a unit
	function deleteUnit(unitIndex) {
		// Show a confirmation dialog
		if (confirm('Are you sure you want to delete this unit? This will also delete all its activities.')) {
			// If the user confirms, proceed with deletion
			courseData.units.splice(unitIndex, 1);
			renderUnits();
			saveCourseToLocalStorage(); // Save changes to local storage
			addActivityCardListeners(); // Add event listeners for activity cards
			addUnitPanelListeners(); // Add event listeners for unit buttons
			calculateDurations(); // Recalculate durations after deletion
		} else {
			// If the user cancels, do nothing
			console.log('Unit deletion canceled.');
		}
	}

	let isCourseInfoVisible = true;

	function toggleCourseInfoVisibility() {
		const courseInfoElement = document.getElementById('course-info');
		if (isCourseInfoVisible) {
			courseInfoElement.style.display = 'none';
		} else {
			courseInfoElement.style.display = 'block';
		}
		isCourseInfoVisible = !isCourseInfoVisible;
	}

	 // Function to move an activity card using the left and right buttons
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
		saveCourseToLocalStorage(); // Save the updated state
		calculateDurations(); // Update durations after moving activities
	}

	//	do after updating the dom
	function reinitializeInteractivity() {
		initializeActivitySortable(); // Reinitialize sortable for activities
		addActivityCardListeners();   // Reattach event listeners for activity actions
	}

	// for use after an activity is moved
	function synchronizeDataWithDOM() {
		updateActivityOrderAfterMove();
		saveCourseToLocalStorage();
	}

    function calculateDurations() {
        let totalCourseMinutes = 0;
        courseData.units.forEach((unit, unitIndex) => {
            let unitMinutes = 0;
            unit.activities.forEach(activity => {
                if (activity && activity.duration && activity.duration !== "N/A") {
                    let [hours, minutes] = activity.duration.split(":").map(Number);
                    unitMinutes += (hours * 60) + minutes;
                }
            });
            $(`.unit-panel[data-index=${unitIndex}] .unit-duration`).text(`Total Duration: ${Math.floor(unitMinutes / 60)}h ${unitMinutes % 60}m`);
            totalCourseMinutes += unitMinutes;
            displayUnitLearningOutcomes(unit, unitIndex);
        });
        $('#total-course-duration').html(`Total Study Hours: ${Math.floor(totalCourseMinutes / 60)}h ${totalCourseMinutes % 60}m`);
    }

	// Function to parse duration input
	function parseDuration(input) {
		if (!input || isNaN(input.replace(":", ""))) {
			return "N/A";
		}
		input = input.trim();

		// Check if input contains ':', indicating hh:mm format
		if (input.includes(":")) {
			let [hours, minutes] = input.split(":").map(Number);
			// Validate hours and minutes
			if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0 || minutes >= 60) {
				return "N/A";
			}
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		} else {
			// Assume the input is a single number in minutes
			let minutes = parseInt(input);
			if (isNaN(minutes) || minutes < 0) {
				return "N/A";
			}
			let hours = Math.floor(minutes / 60);
			minutes = minutes % 60;
			return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		}
	}

    function displayUnitLearningOutcomes(unit, unitIndex) {
        let outcomeSet = new Set();
        unit.activities.forEach(activity => {
            if (activity && activity.outcomes) {
                activity.outcomes.forEach(outcomeIndex => {
                    outcomeSet.add(courseData.learningOutcomes[outcomeIndex]);
                });
            }
        });
        let outcomesText = Array.from(outcomeSet).join('; ');
        $(`.unit-panel[data-index=${unitIndex}] .unit-outcomes`).text(`Learning Outcomes: ${outcomesText}`);
    }

	// Helper functions to calculate the total duration of a unit and get learning outcomes
	function calculateUnitDuration(unit) {
		let totalMinutes = 0;
		unit.activities.forEach(activity => {
			if (activity.duration && activity.duration !== "N/A") {
				let [hours, minutes] = activity.duration.split(":").map(Number);
				totalMinutes += (hours * 60) + minutes;
			}
		});
		return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
	}

	function getUnitLearningOutcomes(unit) {
		let outcomesSet = new Set();
		unit.activities.forEach(activity => {
			activity.outcomes.forEach(outcomeIndex => {
				outcomesSet.add(courseData.learningOutcomes[outcomeIndex]);
			});
		});
		return Array.from(outcomesSet).join('; ');
	}


    function closePopup() {
        $('#popup').removeClass('active').empty();
    }




    function checkUnitsExist() {
        return courseData.units.length > 0;
    }

    //delete course
    function clearCourseData() {
        if (confirm('Are you sure you want to clear all course data? This action cannot be undone.')) {
            courseData = {
                name: "",
                creditHours: 1,
                goal: "",
                description: "",
                learningOutcomes: [],
                units: []
            };
            renderUnits();
            calculateDurations();
            saveCourseToLocalStorage();
        }
    }


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

        $('.delete-learning-outcome').on('click', function () {
            let index = $(this).data('index');
            if (confirm('Are you sure you want to delete this learning outcome?')) {
                courseData.learningOutcomes.splice(index, 1);
                updateLearningOutcomesUI();
            }
        });

        $('.learning-outcome').on('input', function () {
            let index = $(this).data('index');
            courseData.learningOutcomes[index] = $(this).val();
        });
    }

    function saveLearningOutcomes() {
        courseData.learningOutcomes = [];
        $('.learning-outcome').each(function () {
            courseData.learningOutcomes.push($(this).val());
        });
    }

	//get course data from the DOM
    function updateCourseDataFromDOM() {
        courseData.units.forEach((unit, unitIndex) => {
            let activities = [];
            $(`.unit-panel[data-index=${unitIndex}] .activity-card`).each(function () {
                let activityId = $(this).data('activity-id');
                let activity = findActivityById(unitIndex, activityId);
                if (activity) {
                    activities.push(activity);
                }
            });
            courseData.units[unitIndex].activities = activities;
            reindexActivities(unitIndex); // Ensure activities are re-indexed
        });
    }

	//save automatically
    function saveCourseToLocalStorage() {
 	   //console.log("Saving courseData to localStorage:", courseData);
        localStorage.setItem('courseData', JSON.stringify(courseData));
        // console.log ('saved: '+JSON.stringify(courseData))

    }
	//retrieve auto saved course
    function loadCourseFromLocalStorage() {
        let storedData = localStorage.getItem('courseData');
        if (storedData) {
            courseData = JSON.parse(storedData);
            // console.log ('loaded: '+JSON.stringify(courseData))
            updateCourseHeader();
            renderPieChart();
            renderUnits();
            initializeActivitySortable();
	        addActivityCardListeners();
            calculateDurations();
        }
    }



  	initializeQuillEditors();
    initializeColourKey();
    addActivityCardListeners();
    addUnitPanelListeners();
    initializeUnitSortable();
    initializeActivitySortable();
    calculateDurations();
    loadCourseFromLocalStorage();
    updateCourseHeader(); // Initial call to display course name and outcomes
    renderPieChart();
	renderUnits();

  /*  $('body').prepend('<div id="total-course-duration" style="font-size: 16px; font-weight: bold;">Total Study Hours: 0h 0m</div>'); */
});
