document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsDiv.appendChild(participantsTitle);

        const ul = document.createElement("ul");

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // compute initials from name or email prefix
            const label = (typeof p === "string" ? p : String(p));
            const beforeAt = label.split("@")[0];
            const parts = beforeAt.split(/[.\-_ ]+/).filter(Boolean);
            const initials =
              (parts.length === 1
                ? parts[0].slice(0, 2)
                : parts.slice(0, 2).map(s => s[0]).join("")
              ).toUpperCase();

            li.innerHTML = `
              <div class="participant-left">
                <span class="participant-avatar" aria-hidden="true">${initials}</span>
                <span>
                  <span class="participant-name">${label}</span>
                </span>
              </div>
              <button class="participant-delete" title="Unregister ${label}" aria-label="Unregister ${label}" data-email="${label}" data-activity="${name}">×</button>
            `;

            // Attach click handler for unregistering
            ul.appendChild(li);

            const btn = li.querySelector('.participant-delete');
            if (btn) {
              btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const email = btn.dataset.email;
                const activityName = btn.dataset.activity;

                try {
                  const resp = await fetch(
                    `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
                    { method: 'DELETE' }
                  );

                  const result = await resp.json();
                  if (resp.ok) {
                    // Refresh activities to reflect change
                    fetchActivities();
                  } else {
                    console.error('Failed to unregister:', result);
                    alert(result.detail || 'Failed to unregister participant');
                  }
                } catch (err) {
                  console.error('Error unregistering participant:', err);
                  alert('Failed to unregister participant');
                }
              });
            }
          });
        } else {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        }

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities list so UI updates immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
      } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
