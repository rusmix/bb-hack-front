const cells = 21;

async function getItems() {
  const response = await fetch(
    `http://localhost:8082/random-games/list?filters={"partnerId":1}`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}

async function getGeneratedGame(tagIds, themeIds) {
  console.log("tags+ themes", tagIds, themeIds);
  // const response = await fetch(`http://localhost:8082/random-game/mock`);
  const response = await fetch(
    `http://localhost:8082/random-game?filters={"partnerId":1,"gamblerId": 250,"country":"US", "tagIds":${JSON.stringify(
      tagIds
    )}, "themeIds":${JSON.stringify(themeIds)}}`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return await response.json();
}

async function getTagsThemes(labelString, type) {
  const requestString = `http://localhost:8082/${type}?value=${labelString}`;
  const response = await fetch(requestString);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}

async function postGamblerClick(gamblerId, partnerId, externalGameId, action) {
  const requestString = `http://localhost:8082/gambler-click`;
  const response = await fetch(requestString, {
    method: "POST", // Specify the method
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gamblerId,
      partnerId,
      externalGameId,
      action,
    }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}

function closeDropDown(key, type) {
  if (key === "Escape") {
    const dropdown = document.getElementById(`${type}Dropdown`);
    dropdown.innerHTML = "";
  }
}

document
  .getElementById("tagsInput")
  .addEventListener("keyup", async function (event) {
    console.log("event tag:", this.value);
    await showDropdown(this.value, "tags");

    closeDropDown(event.key, "tags");
  });

document
  .getElementById("themesInput")
  .addEventListener("keyup", async function (event) {
    console.log("event theme:", this.value);
    await showDropdown(this.value, "themes");

    closeDropDown(event.key, "themes");
  });

document
  .getElementById("tagsInput")
  .addEventListener("click", async function (event) {
    console.log("event tag:", this.value);

    await showDropdown(this.value, "tags");
  });

document
  .getElementById("themesInput")
  .addEventListener("click", async function (event) {
    console.log("event theme:", this.value);

    await showDropdown(this.value, "themes");
  });

function addFilter(value, id, type) {
  const container = document.getElementById(
    `selected${type.charAt(0).toUpperCase() + type.slice(1)}`
  );
  const filterTag = document.createElement("div");
  filterTag.classList.add("filter-tag");
  filterTag.setAttribute("item_id", id);
  filterTag.textContent = value;
  filterTag.onclick = function () {
    this.remove();
  };
  container.appendChild(filterTag);
}

async function showDropdown(inputValue, type) {
  try {
    const items = await getTagsThemes(inputValue, type); // Assuming getTags works for both tags and themes with appropriate URL
    console.log("items is", items);
    const dropdown = document.getElementById(`${type}Dropdown`);
    dropdown.innerHTML = ""; // Clear previous options

    items.forEach((item) => {
      const option = document.createElement("div");
      option.classList.add("option");
      option.textContent = item.label; // Assuming the API returns an array of objects with a `tag` property
      option.onclick = function () {
        addFilter(item.label, item.id, type);
        dropdown.innerHTML = ""; // Clear options after selection
      };
      dropdown.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to fetch tags/themes:", error);
  }
}

async function generateItems() {
  document.querySelector(".list")?.remove();
  document.querySelector(".scope").innerHTML = `
    <ul class="list"></ul>
  `;

  const list = document.querySelector(".list");
  const items = await getItems(); // Дожидаемся данных

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const li = document.createElement("li");
    li.setAttribute("data-item", JSON.stringify(item));
    li.classList.add("list__item");
    li.innerHTML = `<img src="${item.imgSrc}" alt="" />`;

    list.append(li);
  }
}

let isStarted = false;
let isFirstStart = true;

async function sendClick(externalGameId) {
  console.log("sendingClick");

  await postGamblerClick(250, 1, externalGameId, "click");

  return false;
}

async function start() {
  if (isStarted) return;
  else isStarted = true;

  if (!isFirstStart) {
    console.log("game skipped");
    const list = document.querySelector(".list");
    const winItem = list.querySelectorAll('[data-win="win"]')[0];
    const data = JSON.parse(winItem.getAttribute("data-item"));

    console.log("skipped game id", data.externalGameId);

    await postGamblerClick(250, 1, data.externalGameId, "skip");
  }

  await generateItems();

  const list = document.querySelector(".list");

  const randomPosition = 63 + Math.random() * 2.5;

  setTimeout(() => {
    list.style.left = "50%";
    list.style.transform = `translate3d(-${randomPosition}%, 0, 0)`;
  }, 0);

  // const item = list.querySelectorAll("li")[0];
  // console.log(item);

  const selectedTags = Array.from(
    document.getElementById("selectedTags").children
  ).map((tag) => Number(tag.getAttribute("item_id")));

  const selectedThemes = Array.from(
    document.getElementById("selectedThemes").children
  ).map((theme) => Number(theme.getAttribute("item_id")));

  const winGame = await getGeneratedGame(selectedTags, selectedThemes);

  const li = document.createElement("li");
  li.setAttribute("data-item", JSON.stringify(winGame));
  li.setAttribute("data-win", "win");
  li.classList.add("list__item");
  li.innerHTML = `<a href=${winGame.gameHref} onclick="return sendClick(${winGame.externalGameId})"> <img src="${winGame.imgSrc}" alt="Start playing game" /> </a>`;

  list.append(li);

  const winItem = list.querySelectorAll("li")[13];
  const realWinItem =
    list.querySelectorAll("li")[list.querySelectorAll("li").length - 1];

  setTimeout(() => {
    const winItemHTML = winItem.outerHTML;

    // Меняем местами элементы
    winItem.outerHTML = realWinItem.outerHTML; // Заменяем HTML winItem на HTML realWinItem
    realWinItem.outerHTML = winItemHTML;
  }, 0);

  // isFirstStart = false;

  list.addEventListener(
    "transitionend",
    () => {
      isStarted = false;
      const winItem1 = list.querySelectorAll("li")[13];
      winItem1.classList.add("active");
      const data = JSON.parse(winItem1.getAttribute("data-item"));

      console.log(data);
    },
    { once: true }
  );

  isFirstStart = false;
}

let FPSCounter = 0;
function FPSIncrementer() {
  FPSCounter++;

  requestAnimationFrame(arguments.callee);
}
FPSIncrementer();

function FPSViewer() {
  document.querySelector(".FPS").innerHTML = FPSCounter * 2;
  FPSCounter = 0;

  setTimeout(arguments.callee, 500);
}
FPSViewer();
