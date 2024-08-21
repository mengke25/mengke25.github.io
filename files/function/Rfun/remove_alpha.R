remove_alpha <- function(df_name, var_name) {
  # Check if the variable exists in the specified dataframe
  # Extract the variable from the dataframe
  var <- get(var_name, envir = as.environment(df_name))
  
  # Check if the variable is character
  if (is.character(var)) {
    # Remove ":" and specified letters from character variable using gsub
    var <- gsub("[:a-z]", "", var)
    cat("Variable", var_name, "in dataframe", df_name, "processed successfully.\n")
  } else {
    cat("Variable", var_name, "in dataframe", df_name, "is not a character variable.\n")
  }
  
  # Return the processed variable
  return(var)
}
