import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Effect,
  OpenIdConnectProvider,
  PolicyDocument,
  PolicyStatement,
  Role,
  WebIdentityPrincipal,
} from "aws-cdk-lib/aws-iam";

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const githubOIDCProvider = new OpenIdConnectProvider(
      this,
      "GitHubOIDCProvider",
      {
        clientIds: ["sts.amazonaws.com"],
        thumbprints: ["a031c46782e6e6c662c2c87c76da9aa62ccabd8e"],
        url: "https://token.actions.githubusercontent.com",
      }
    );

    const githubActionsRole = new Role(this, "GitHubActionsRole", {
      assumedBy: new WebIdentityPrincipal(
        githubOIDCProvider.openIdConnectProviderArn,
        {
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              "repo:lukehedger/aws-github-oidc:*",
          },
        }
      ),
      inlinePolicies: {
        allowListAllBuckets: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["s3:GetBucketLocation", "s3:ListAllMyBuckets"],
              resources: ["*"],
            }),
          ],
        }),
      },
      roleName: "github-actions-role",
    });

    new CfnOutput(this, "GithubActionsRoleArn", {
      value: githubActionsRole.roleArn,
    });
  }
}
