
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

setGlobalOptions({
  maxInstances: 10,
  region: "asia-south1"
});

// Round 1 configuration
const ROUND_ID = "round1";


const QUESTIONS = [
  {
    id: "Q01",
    image: "R1_Q01.jpg",
    answer: "CHRONO_INDUS_BRONZE",
    points: 5
  },
  {
    id: "Q02",
    image: "R1_Q02.png",
    answer: "NILE",
    points: 5
  },
  {
    id: "Q03",
    image: "R1_Q03.png",
    answer: "DJED",
    points: 5
  },
  {
    id: "Q04",
    image: "R1_Q04.png",
    answer: "EUPHRATES",
    points: 5
  },
  {
    id: "Q05",
    image: "R1_Q05.png",
    answer: "ROSETTA",
    points: 5
  },
  {
    id: "Q06",
    image: "R1_Q06.png",
    answer: "HORNED_DEITY_HARAPPA",
    points: 5
  },
  {
    id: "Q07",
    image: "R1_Q07.png",
    answer: "HORUS",
    points: 5
  },
  {
    id: "Q08",
    image: "R1_Q08.png",
    answer: "ENKI",
    points: 5
  },
  {
    id: "Q09",
    image: "R1_Q09.png",
    answer: "OSIRIS",
    points: 5
  },
  {
    id: "Q10",
    image: "R1_Q10.png",
    answer: "CHOLA_VIMANA",
    points: 5
  },
  {
    id: "Q11",
    image: "R1_Q11.png",
    answer: "COSMIC_DANCE_CHOLA",
    points: 5
  },
  {
    id: "Q12",
    image: "R1_Q12.png",
    answer: "PALLAVA_DYNASTY",
    points: 5
  },
  {
    id: "Q13",
    image: "R1_Q13.png",
    answer: "MODHERA_SOLAR_EQUINOX",
    points: 5
  },
  {
    id: "Q14",
    image: "R1_Q14.png",
    answer: "VIJAYANAGARA_AXLE_77",
    points: 5
  },
  {
    id: "Q15",
    image: "R1_Q15.png",
    answer: "GARBHAGRIHA_FRAGMENT_SECURED",
    points: 5
  }
];


// 3 random questions
exports.registerTeam = onCall(async (request) => {
  const { teamId, teamName } = request.data || {};

  if (
    typeof teamId !== "string" ||
    typeof teamName !== "string" ||
    !teamId.trim() ||
    !teamName.trim()
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Team ID and Team Name are required."
    );
  }

   
const cleanTeamId = teamId.trim();
const cleanTeamName = teamName.trim();

// Admin login
if (
  cleanTeamId.toLowerCase() === "admin" &&
  cleanTeamName.toLowerCase() === "admin"
) {
  return {
    success: true,
    isAdmin: true,
    teamId: "admin",
    teamName: "admin",
    assignedQuestions: []
  };
}

// Reserve admin ID
if (cleanTeamId.toLowerCase() === "admin") {
  throw new HttpsError(
    "invalid-argument",
    "Invalid Team ID or Team Name."
  );
}

const teamRef = db.collection("teams").doc(cleanTeamId);


  const result = await db.runTransaction(async (transaction) => {
    const existingTeam = await transaction.get(teamRef);

    if (existingTeam.exists) {
      const teamData = existingTeam.data();

      if (teamData.teamName !== cleanTeamName) {
        throw new HttpsError(
          "already-exists",
          "This Team ID belongs to another team."
        );
      }

      transaction.update(teamRef, {
        loginAt: FieldValue.serverTimestamp(),
        logoutAt: null
      });

      return {
        teamId: teamData.teamId,
        teamName: teamData.teamName,
        assignedQuestions: teamData.assignedQuestions
      };
    }

    // Shuffle questions using Fisher-Yates
    const shuffled = [...QUESTIONS];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] =
        [shuffled[j], shuffled[i]];
    }

    const assignedQuestions = shuffled.slice(0, 3);

    transaction.set(teamRef, {
      teamId: cleanTeamId,
      teamName: cleanTeamName,
      roundId: ROUND_ID,
      assignedQuestions,
      totalPoints: 0,
      registeredAt: FieldValue.serverTimestamp(),
      loginAt: FieldValue.serverTimestamp(),
      logoutAt: null
    });

    return {
      teamId: cleanTeamId,
      teamName: cleanTeamName,
      assignedQuestions
    };
  });

  // Never send correct answers to the participant website
  const publicQuestions = result.assignedQuestions.map(
    (question) => ({
      id: question.id,
      image: question.image,
      points: question.points
    })
  );

  return {
    success: true,
    teamId: result.teamId,
    teamName: result.teamName,
    assignedQuestions: publicQuestions
  };
});


// Record team logout
exports.logoutTeam = onCall(async (request) => {
  const { teamId } = request.data;

  if (!teamId) {
    throw new HttpsError(
      "invalid-argument",
      "Team ID is required."
    );
  }

  const teamRef = db.collection("teams").doc(teamId);

  const team = await teamRef.get();

  if (!team.exists) {
    throw new HttpsError(
      "not-found",
      "Team does not exist."
    );
  }

  await teamRef.update({
    logoutAt: FieldValue.serverTimestamp()
  });

  return {
    success: true
  };
});


 // Submit an answer and award points
exports.submitAnswer = onCall(async (request) => {
  const { teamId, questionId, answer } = request.data || {};

  if (
    typeof teamId !== "string" ||
    typeof questionId !== "string" ||
    typeof answer !== "string" ||
    !teamId.trim() ||
    !questionId.trim() ||
    !answer.trim()
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Team ID, Question ID and answer are required."
    );
  }

  const cleanTeamId = teamId.trim();
  const cleanQuestionId = questionId.trim();

  // Find the correct question on the server
  const question = QUESTIONS.find(
    (q) => q.id === cleanQuestionId
  );

  if (!question) {
    throw new HttpsError(
      "not-found",
      "Question does not exist."
    );
  }

  // Normalize answers for comparison
  const normalizeAnswer = (value) =>
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

  const isCorrect =
    normalizeAnswer(answer) ===
    normalizeAnswer(question.answer);

  const pointsAwarded = isCorrect
    ? question.points
    : 0;

  const teamRef = db.collection("teams").doc(cleanTeamId);

  const submissionRef = db
    .collection("submissions")
    .doc(`${cleanTeamId}_${cleanQuestionId}`);

  const result = await db.runTransaction(async (transaction) => {

    const teamSnapshot = await transaction.get(teamRef);

    if (!teamSnapshot.exists) {
      throw new HttpsError(
        "not-found",
        "Team does not exist."
      );
    }

    const teamData = teamSnapshot.data();

    // Check that this question was assigned to the team
    const assignedQuestion =
      teamData.assignedQuestions.find(
        (q) => q.id === cleanQuestionId
      );

    if (!assignedQuestion) {
      throw new HttpsError(
        "permission-denied",
        "This question was not assigned to your team."
      );
    }

    // Check for an existing submission
    const existingSubmission =
      await transaction.get(submissionRef);

    if (existingSubmission.exists) {
      throw new HttpsError(
        "already-exists",
        "You have already submitted this question."
      );
    }

    // Save submission
    transaction.set(submissionRef, {
      teamId: cleanTeamId,
      teamName: teamData.teamName,
      roundId: ROUND_ID,
      questionId: cleanQuestionId,
      submittedAnswer: answer.trim(),
      isCorrect,
      pointsAwarded,
      submittedAt: FieldValue.serverTimestamp()
    });

    // Update total team points
    transaction.update(teamRef, {
      totalPoints: FieldValue.increment(pointsAwarded)
    });

    return {
      isCorrect,
      pointsAwarded
    };
  });

  return {
    success: true,
    isCorrect: result.isCorrect,
    pointsAwarded: result.pointsAwarded,
    message: result.isCorrect
      ? "Correct! You earned 5 points."
      : "Incorrect. You earned 0 points."
  };
});


 // Admin: Get all team results

exports.getAdminResults = onCall(async (request) => {

  const { teamId, teamName } = request.data || {};

  // Admin login validation
  if (
    typeof teamId !== "string" ||
    typeof teamName !== "string" ||
    teamId.trim().toLowerCase() !== "admin" ||
    teamName.trim().toLowerCase() !== "admin"
  ) {
    throw new HttpsError(
      "permission-denied",
      "Admin access denied."
    );
  }

  // Get all teams
  const teamsSnapshot = await db
    .collection("teams")
    .get();

  // Get all submissions
  const submissionsSnapshot = await db
    .collection("submissions")
    .get();

  const submissions = submissionsSnapshot.docs.map(
    (doc) => doc.data()
  );

  const teams = teamsSnapshot.docs.map((doc) => {

    const team = doc.data();

    const teamSubmissions = submissions.filter(
      (submission) =>
        submission.teamId === team.teamId
    );

    return {
      teamId: team.teamId,
      teamName: team.teamName,

      assignedQuestions: team.assignedQuestions.map(
        (question) => ({
          id: question.id,
          image: question.image,
          points: question.points
        })
      ),

      submissions: teamSubmissions,

      totalPoints: team.totalPoints || 0,

      registeredAt: team.registeredAt,
      loginAt: team.loginAt,
      logoutAt: team.logoutAt
    };
  });

  return {
    success: true,
    teams
  };
});

