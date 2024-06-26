function getPossibilitiesRunner(knownWords) {

  let allPossibilities = [];

  // get elements with the attribute role = "board"
  boards = document.querySelectorAll('[role="table"]');
  // for each board
  for (let i = 0; i < 4; i++) {
    let gameRows = boards[i].children;

    final_word = [undefined, undefined, undefined, undefined, undefined];
    // key is the letter, value is the list of indices where it doesn't belong
    yellow_letters = {};
    black_letters = [];

    for (let i = 0; i < gameRows.length; i++) {
      // get the game-tiles
      let gameTiles = gameRows[i].children;
      for (let j = 0; j < gameTiles.length; j++) {
        let letter = gameTiles[j].children[0].innerText.toLowerCase();
        let evaluation =  gameTiles[j].ariaLabel
        // if evaluation has incorrect

        if (evaluation.includes(" correct")) {
          final_word[j] = letter;
        } else if (evaluation.includes("different")) {
          if (yellow_letters[letter] == undefined) {
            yellow_letters[letter] = [];
          }
          yellow_letters[letter].push(j);
        } else if (evaluation.includes("incorrect")){
          black_letters.push(letter);
        }
      }
    }

    // generate the possibilities
    possibilities = [];

    // for each word in the known words
    for (let i = 0; i < knownWords.length; i++) {
        let word = knownWords[i];


        // Check the black letters
        // if any of the black letters are in the word, skip over this word
        let black_letter_in_word = false;
        for (let j = 0; j < black_letters.length; j++) {
          // if the black letter is in the final_word, continue
          if (final_word.indexOf(black_letters[j]) > -1) {
            continue;
          }
          // if the letter is in yellow letters continue
          if (black_letters[j] in yellow_letters) {
            continue;
          }
          if (word.includes(black_letters[j])) {
              black_letter_in_word = true;
              break;
          }
        }
        if (black_letter_in_word) {
            continue;
        }

        // Check green letters
        // check that the word contains all of the green letters in the correct positions in final word
        valid_word = true;
        for (let j = 0; j < final_word.length; j++) {
            if (final_word[j] == undefined) {
                continue;
            } else if (word[j] != final_word[j]) {
                valid_word = false;
                break;
            }
        }
        if (!valid_word) {
            continue;
        }

        // Check the yellow letters
        // yellow letters is a dictionary of the letters that are in the word and the value is a list of indices where it doesn't belong
        should_skip = false;
        for(let letter in yellow_letters) {
          if (!word.includes(letter)) {
            should_skip = true;
            break;
          }
          for (let i = 0; i < yellow_letters[letter].length; i++) {
            let pos = yellow_letters[letter][i];
            if (word[pos] == letter) {
              should_skip = true;
              break;
            }
          }
        }

        if (should_skip) {
          continue;
        }

        // if we get here, the word is valid
        possibilities.push(word);
    }

    allPossibilities.push(possibilities);
  }

  console.log("allPossibilities: ", allPossibilities);

  // TODO: could potentially make words a different color or highlighted
  // if they interest across all boards
  let html = "";
  for (let i = 0; i < allPossibilities.length; i++) {
    if ((i + 1 ) % 2 == 1) {
      html += "<div style='display: flex; flex-direction: row; justify-content: center'>";
    }
    html += "<div style='padding-left: 20px; border: dotted 2px black; margin: 5px '>"
    html += "<p>Board " + (i + 1) + " :</p>";
    html += "<ul id='possibilities_" + (i + 1) + "' style=' padding-left: 10px; padding-right: 30px'>";
    for (let j = 0; j < allPossibilities[i].length; j++) {
      html += "<li>" + allPossibilities[i][j] + "</li>";
    }
    html += "</ul>";
    html += "</div>";
    if ((i + 1) % 2 == 0) {
      html += "</div>";
    }
  }

  return html;
}

async function runner() {

  // fetch knownwords.json
  let response = await fetch("knownwords.json");
  let knownWords = await response.json();

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.match('quordle.com|merriam-webster.com')) {
    // if the tab is not on quordle.com, or merriam-webster.com, do nothing and display link to quordle.com
    document.getElementById("possibilities").innerHTML = "<p>Please go to <a href='https://quordle.com' target='_blank'>quordle.com</a> to use this extension.</p>";
    return;
  }


  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getPossibilitiesRunner,
    args: [knownWords],
  }, (result) => {
    // get possibilities element
    document.getElementById("possibilities").innerHTML = result[0].result;
  });
}

runner();
