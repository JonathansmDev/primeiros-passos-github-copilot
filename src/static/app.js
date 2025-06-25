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

        // Monta a lista de participantes
        let participantsSection = '';
        if (details.participants && details.participants.length > 0) {
          participantsSection = `
            <div class="participants">
              <h5>Participantes inscritos:</h5>
              <ul>
                ${details.participants.map(p => `
                  <li>
                    <span class="participant-name">${p}</span>
                    <button class="remove-participant" data-activity="${name}" data-participant="${p}" title="Remover participante">&times;</button>
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
        } else {
          participantsSection = `
            <div class="participants">
              <h5>Participantes inscritos:</h5>
              <ul><li><em>Nenhum inscrito ainda</em></li></ul>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Agenda:</strong> ${details.schedule}</p>
          <p><strong>Disponibilidade:</strong> ${spotsLeft} vagas disponíveis</p>
          ${participantsSection}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Falha ao carregar atividades. Por favor, tente novamente mais tarde.</p>";
      console.error("Erro ao buscar atividades:", error);
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
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Atualiza a listagem após adicionar participante
      } else {
        messageDiv.textContent = result.detail || "Ocorreu um erro";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Falha na inscrição. Por favor, tente novamente.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Erro na inscrição:", error);
    }
  });

  // Adiciona evento de remoção de participante (delegação)
  activitiesList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-participant')) {
      const activity = e.target.getAttribute('data-activity');
      const participant = e.target.getAttribute('data-participant');
      if (confirm(`Remover participante ${participant} da atividade ${activity}?`)) {
        try {
          const response = await fetch(`/activities/${encodeURIComponent(activity)}/remove?email=${encodeURIComponent(participant)}`, {
            method: 'POST',
          });
          const result = await response.json();
          if (response.ok) {
            messageDiv.textContent = result.message || 'Participante removido com sucesso!';
            messageDiv.className = 'success';
            fetchActivities();
          } else {
            messageDiv.textContent = result.detail || 'Erro ao remover participante.';
            messageDiv.className = 'error';
          }
          messageDiv.classList.remove('hidden');
          setTimeout(() => messageDiv.classList.add('hidden'), 5000);
        } catch (error) {
          messageDiv.textContent = 'Erro ao remover participante.';
          messageDiv.className = 'error';
          messageDiv.classList.remove('hidden');
        }
      }
    }
  });

  // Initialize app
  fetchActivities();
});
