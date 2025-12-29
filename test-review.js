/**
 * Test script to verify AI review response format
 */

import { runReview } from "./reviewer/llm.js";

const testDiff = `@@ -1,3 +1,15 @@
 export function Prose({ children, className }) {
   return (
+    <div className={clsx(className, 'prose dark:prose-invert')}>{children}</div>
+    <div className={clsx(className, 'prose dark:prose-invert')}>{children}</div>
+    <div className={clsx(className, 'prose dark:prose-invert')}>{children}</div>
+    <div className={clsx(className, 'prose dark:prose-invert')}>{children}</div>
+    <div className={clsx(className, 'prose dark:prose-invert')}>{children}</div>
     <div className={clsx(className, 'prose dark:prose-invert')}>{children}</div>
   )
 }`;

async function test() {
  console.log("🧪 Testing AI review with sample diff...\n");
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY not set");
    process.exit(1);
  }

  try {
    const result = await runReview(testDiff, apiKey);
    console.log("\n✅ Review result:");
    console.log(JSON.stringify(result, null, 2));
    
    if (result.issues && result.issues.length > 0) {
      console.log(`\n✅ SUCCESS: Got ${result.issues.length} issues with line numbers`);
      result.issues.forEach((issue, i) => {
        console.log(`\nIssue ${i + 1}:`);
        console.log(`  Line: ${issue.line}`);
        console.log(`  Severity: ${issue.severity}`);
        console.log(`  Description: ${issue.description.substring(0, 60)}...`);
      });
    } else {
      console.log("\n⚠️ No issues found - check if AI is following format");
    }
  } catch (err) {
    console.error("❌ Test failed:", err.message);
    process.exit(1);
  }
}

test();

