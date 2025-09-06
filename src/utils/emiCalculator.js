// utils/emiCalculator.js
function addToDate(date, count, type) {
  const newDate = new Date(date);
  if (type === "month") {
    newDate.setMonth(newDate.getMonth() + count);
  } else if (type === "days") {
    newDate.setDate(newDate.getDate() + count);
  }
  return newDate;
}

exports.generateEmi = ({
  loanAmount,
  intrestRate,
  intrestRateType, 
  loanTenuare,
  loanTenuareType, 
  repaymentFrequency,
  repaymentFrequencyType, 
}) => {
  let totalPayable = 0;
  let totalInstallments = 0;
  let emiAmount = 0;
  if (loanTenuareType === repaymentFrequencyType) {
    totalInstallments = loanTenuare / repaymentFrequency;
  } else {
    if (loanTenuareType === "month" && repaymentFrequencyType === "days") {
      totalInstallments = (loanTenuare * 30) / repaymentFrequency;
    } else if (
      loanTenuareType === "days" &&
      repaymentFrequencyType === "month"
    ) {
      totalInstallments = loanTenuare / (repaymentFrequency * 30);
    }
  }
  totalInstallments = Math.floor(totalInstallments);

  // 2. Interest calculation
  if (intrestRateType === "flat" || intrestRateType === "simple") {
    const totalInterest = (loanAmount * intrestRate * loanTenuare) / 100;
    totalPayable = loanAmount + totalInterest;
    emiAmount = totalPayable / totalInstallments;
  } else if (intrestRateType === "reducing") {
    // monthly reducing balance formula
    const rate =
      repaymentFrequencyType === "month"
        ? intrestRate / 100 / 12
        : intrestRate / 100 / 30; // approx daily
    const n = totalInstallments;
    emiAmount =
      (loanAmount * rate * Math.pow(1 + rate, n)) /
      (Math.pow(1 + rate, n) - 1);
    totalPayable = emiAmount * n;
  } else if (intrestRateType === "compound") {
    const totalAmount =
      loanAmount * Math.pow(1 + intrestRate / 100, loanTenuare);
    totalPayable = totalAmount;
    emiAmount = totalAmount / totalInstallments;
  }

  // 3. EMI Schedule build
  let emiSchedule = [];
  let currentDate = new Date();
  for (let i = 1; i <= totalInstallments; i++) {
    currentDate = addToDate(currentDate, repaymentFrequency, repaymentFrequencyType);
    emiSchedule.push({
      expectedDate: currentDate.toISOString().split("T")[0],
      amount: Math.round(emiAmount),
      status: "pending",
    });
  }

  return {
    totalPayable: Math.round(totalPayable),
    totalInstallments,
    emiAmount: Math.round(emiAmount),
    emiSchedule,
  };
};
