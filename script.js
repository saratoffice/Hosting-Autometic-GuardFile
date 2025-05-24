
$(document).ready(function () {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSSOfHNpEttmFST4PX2HIgKv0Gd0O2XzUBU17D0-gJHQbgQxnB_1mYNEI90diCjvVXsDJ1oBJ6iAeL2/pub?gid=51131841&single=true&output=csv';

  Papa.parse(csvUrl, {
    download: true,
    header: true,
    complete: function (results) {
      let data = results.data;

      // First process all data and add SortDate
      data = data.map((row, index) => {
        row["Subject"] = (row["Subject"] || "").replace(/_/g, " ").replace(/\.pdf$/i, "").trim();
        const rawDate = (row["Date"] || "").trim().replace(/\s/g, "-");

        const parts = rawDate.split("-");
        if (parts.length === 3) {
          let [dd, mm, yyyy] = parts;
          dd = dd.padStart(2, '0');
          mm = mm.padStart(2, '0');
          if (yyyy.length === 4) {
            row["SortDate"] = `${yyyy}-${mm}-${dd}`;
            row["Date"] = `${dd}-${mm}-${yyyy}`;
          } else {
            row["SortDate"] = null;
          }
        } else {
          row["SortDate"] = null;
        }

        return row;
      });

      // Sort by date first
      data.sort((a, b) => {
        if (!a.SortDate && !b.SortDate) return 0;
        if (!a.SortDate) return 1;
        if (!b.SortDate) return -1;
        return new Date(b.SortDate) - new Date(a.SortDate);
      });

      // Now add sequential S.N. after sorting
      data.forEach((row, index) => {
        row["S.N."] = index + 1;
      });

      const tbody = $('#saraCsvTableV2 tbody');
      tbody.empty();

      data.forEach(row => {
        const tableRow = `
          <tr>
            <td data-label="S.N.">${row["S.N."]}</td>
            <td data-label="Letter No.">${row["Letter No."] || ""}</td>
            <td data-label="Date" data-sort="${row["SortDate"] || ''}">${row["Date"] || ""}</td>
            <td data-label="Subject">${row["Subject"] || ""}</td>
            <td data-label="Download">${row["Button"] || ""}</td>
            <td data-label="File Size">${row["File Size (MB)"] || "—"}</td>
          </tr>`;
        tbody.append(tableRow);
      });

      $('#saraCsvTableV2').DataTable({
        responsive: true,
        pageLength: 10,
        lengthMenu: [[5, 10, 25, 50, 100, -1], [5, 10, 25, 50, 100, "All"]],
        autoWidth: false,
        order: [[2, 'desc']], // Keep default sorting by date
        columnDefs: [
          {
            targets: 0, // S.N. column
            orderable: false // Disable sorting on this column
          }
        ],
        language: {
          search: "Search:",
          lengthMenu: "Show _MENU_ entries",
          info: "Showing _START_ to _END_ of _TOTAL_ entries",
          infoEmpty: "No records available",
          infoFiltered: "(filtered from _MAX_ total entries)",
          paginate: {
            first: "First",
            last: "Last",
            next: "Next",
            previous: "Previous"
          }
        },
        drawCallback: function(settings) {
          // Re-number the S.N. column after each draw (sort/filter/page)
          const api = this.api();
          api.column(0, {page: 'current'}).nodes().each(function(cell, i) {
            cell.innerHTML = i + 1 + (api.page() * api.page.len());
          });
        }
      });
    },
    error: function (err) {
      console.error('CSV Load Error:', err);
      alert('Failed to load data. Please try again later.');
    }
  });
});
