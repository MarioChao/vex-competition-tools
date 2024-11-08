// Grid table

// How to use: set class attribute to "grid-table"

// Converts child elements into a grid / table
// Number of columns determined by attribute "data-columns"

// Variables

const className = "grid-table";
const columnsAttributeName = "columns";

// Local functions

function initializePairedTables() {
	// Get elements with class name
	const _pairedTableContainers = document.getElementsByClassName(className);

	// Convert each element to a paired table
	for (const pairedTableContainer of _pairedTableContainers) {
		// Prepare table element
		const tableElement = document.createElement("table");

		// Get number of cells per row
		const columnsCount = pairedTableContainer.dataset[columnsAttributeName] || 2;

		// Group child elements into rows with `columnsCount` columns
		let tableRow = tableElement.insertRow();
		while (pairedTableContainer.children.length > 0) {
			// Get first child element
			const childElement = pairedTableContainer.firstElementChild;

			// Validate not br
			if (childElement.nodeName === "BR") {
				pairedTableContainer.removeChild(childElement);
				continue;
			}

			// Insert a new row if there are `columnsCount` columns
			if (tableRow.childElementCount >= columnsCount) {
				tableRow = tableElement.insertRow();
			}

			// Insert cell and append child element
			tableRow.insertCell().appendChild(childElement);
		}

		// Insert final table into container
		pairedTableContainer.appendChild(tableElement);
	}
}

function onDOMContentLoaded() {
	initializePairedTables();
}

window.addEventListener("DOMContentLoaded", onDOMContentLoaded);
